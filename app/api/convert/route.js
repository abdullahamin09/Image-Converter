import { NextResponse } from "next/server";
import JSZip from "jszip";
import sharp from "sharp";

export async function POST(req) {
    const formData = await req.formData();

    const files = formData.getAll("files");
    const format = formData.get("format");
    const quality = formData.get("quality");

    const converted = [];

    for (let file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());

        let image = sharp(buffer);

        // 🔥 LOSSLESS if no quality
        if (!quality) {
            if (format === "webp") {
                image = image.webp({ lossless: true });
            } else if (format === "png") {
                image = image.png({ compressionLevel: 0 });
            } else if (format === "jpeg") {
                image = image.jpeg({ quality: 100 });
            }
        } else {
            image = image.toFormat(format, {
                quality: Number(quality),
            });
        }

        const output = await image.toBuffer();
        converted.push(output);
    }

    // Single file
    if (converted.length === 1) {
        return new NextResponse(converted[0], {
            headers: {
                "Content-Type": `image/${format}`,
                "Content-Disposition": `attachment; filename=image.${format}`,
            },
        });
    }

    // Multiple → ZIP
    const zip = new JSZip();

    converted.forEach((file, i) => {
        zip.file(`image-${i + 1}.${format}`, file);
    });

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(zipBuffer, {
        headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": "attachment; filename=images.zip",
        },
    });
}