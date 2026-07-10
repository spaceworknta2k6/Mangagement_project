const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, HeadingLevel } = require('docx');

const IMG_DIR = '../../screenshots_real_ui';
const MAP_FILE = path.join(IMG_DIR, 'map.json');
const OUT_FILE = '../../BaoCao_GiaoDien_ThucTe_v2.docx';

if (!fs.existsSync(MAP_FILE)) {
    console.error("Map file not found!");
    process.exit(1);
}

const flows = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));

const doc = new Document({
    sections: [{
        properties: {
            page: {
                margin: { top: 1417, right: 1134, bottom: 1417, left: 1701 } // 2.5cm, 2cm, 2.5cm, 3cm
            }
        },
        children: [
            new Paragraph({
                text: "DANH MỤC HÌNH ẢNH GIAO DIỆN THỰC TẾ",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
            }),
            ...flows.flatMap((item, index) => {
                const imgPath = path.join(IMG_DIR, item.file);
                if (!fs.existsSync(imgPath)) return [];

                return [
                    new Paragraph({
                        spacing: { before: 400, after: 200 },
                        alignment: AlignmentType.CENTER,
                        children: [
                            new ImageRun({
                                data: fs.readFileSync(imgPath),
                                transformation: { width: 600, height: 375 },
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                        children: [
                            new TextRun({
                                text: `Hình ${index + 1}: ${item.caption}`,
                                italics: true,
                                size: 24, // 12pt
                            }),
                        ],
                    })
                ];
            })
        ],
    }]
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync(OUT_FILE, buffer);
    console.log(`Successfully generated ${OUT_FILE}`);
});
