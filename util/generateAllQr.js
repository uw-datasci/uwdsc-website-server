require("../models/eventModel");
const { default: mongoose } = require("mongoose");
const Event = mongoose.model("events");
const bcrypt = require("bcrypt");
const connectDb = require("../config/dbConnection");
const QRCode = require("qrcode");
const { PDFDocument, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const fs = require("fs");
const dotenv = require("dotenv").config({ path: "../.env" });

const textFontBytes = fs.readFileSync("norwester.otf");
const logoFontBytes = fs.readFileSync("jersey-10.otf");
const fedSvgPaths = (() => {
  const svgString = fs.readFileSync("fed-2.svg").toString();
  const regex = /d="([^"]*)"/g;
  let match;
  const matches = [];

  while ((match = regex.exec(svgString)) !== null) {
    matches.push(match[1]);
  }

  return matches;
})()


function splitTextIntoLines(text, font, fontSize, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (let word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const testLineWidth = font.widthOfTextAtSize(testLine, fontSize);

    // If adding the word exceeds the maximum width, push the current line and start a new one.
    if (testLineWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  // Push any remaining text as the last line
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

// Main function that generates the PDF
async function createPdfWithQRCodes(dataList) {
  // 1) Load the background PDF (make sure background.pdf is in the same folder)
  const backgroundBytes = fs.readFileSync("background.pdf");
  const backgroundPdf = await PDFDocument.load(backgroundBytes);

  // 2) Create a new PDFDocument for the output
  const outPdf = await PDFDocument.create();
  outPdf.registerFontkit(fontkit);
  const textFont = await outPdf.embedFont(textFontBytes);
  const logoFont = await outPdf.embedFont(logoFontBytes);

  // 3) For each JSON object in dataList:
  for (let i = 0; i < dataList.length; i++) {
    console.log(`Generating... (${i+1}/${dataList.length})`)
    // a) Generate QR code from the JSON payload
    const name = dataList[i].name;
    delete dataList[i].name;
    const payload = JSON.stringify(dataList[i]);
    const qrCodeDataUrl = await QRCode.toDataURL(payload);

    // b) Copy the background page from backgroundPdf
    //    - If backgroundPdf has multiple pages, choose which one(s) you want to copy
    const [bgPage] = await outPdf.copyPages(backgroundPdf, [0]);
    //    - Add the page to our output PDF
    outPdf.addPage(bgPage);

    // c) Get a reference to the last page we just added
    const page = outPdf.getPage(outPdf.getPageCount() - 1);

    // d) Embed the QR code (which is a PNG image in a data URL)
    const qrImage = await outPdf.embedPng(qrCodeDataUrl);

    // e) Decide how big and where you want to place the QR code
    //    For example, scale down to 150px wide, keep aspect ratio
    const qrDim = 66;
    const aspectRatio = qrImage.width / qrImage.height;
    const qrWidth = qrDim;
    const qrHeight = qrDim / aspectRatio;

    // f) Place the QR code at some position (x, y) from bottom-left corner
    //    For example, place near top-left corner with a margin
    const QRxPos = 46.25;
    const QRyPos = page.getHeight() - qrHeight - 84;
    page.drawImage(qrImage, {
      x: QRxPos,
      y: QRyPos,
      width: qrWidth,
      height: qrHeight,
    });

    let logoXPos = 43;
    const logoYPos = 129;
    const logoFontSize = 55;
    const logo = "CxC"
    logo.split("").forEach((letter) => {
      page.drawText(letter, {
        x: logoXPos,
        y: logoYPos,
        size: logoFontSize,
        font: logoFont,
        color: rgb(1, 1, 1),
      });

      logoXPos += logoFont.widthOfTextAtSize(letter, logoFontSize) + 2
    })
    

    let subLogoXPos = 42;
    const subLogoYPos = 119;
    const subLogoFontSize = 8;
    const subLogo = "powered by"
    subLogo.split("").forEach((letter) => {
      page.drawText(letter, {
        x: subLogoXPos,
        y: subLogoYPos,
        size: subLogoFontSize,
        font: logoFont,
        color: rgb(1, 1, 1),
      });

      subLogoXPos += logoFont.widthOfTextAtSize(letter, subLogoFontSize) + 0.5
    })

    const fedXPos = subLogoXPos + 3;
    const fedYPos = subLogoYPos + 6;
    const fedScale = 0.08;
    fedSvgPaths.forEach((path, i) => {
      page.drawSvgPath(path, {
        x: fedXPos,
        y: fedYPos,
        scale: fedScale,
        color: i == 5 ? rgb(0.12549019607843137, 0.8745098039215686, 0.6509803921568628): rgb(1,1,1),
      })
    })
    

    const positionXPos = 210;
    let positionYPos = 120;
    const positionFontSize = 8;
    const position = "Hacker"
    page.drawText(position, {
      x: positionXPos - ( textFont.widthOfTextAtSize(position, positionFontSize) / 2 ),
      y: positionYPos,
      size: positionFontSize,
      font: textFont,
      color: rgb(1, 1, 1),
    });
    
    // g) Draw name below QR
    const nameXPos = positionXPos;
    let nameYPos = positionYPos - 17;
    const nameFontSize = 15;
    const lines = splitTextIntoLines(name, textFont, nameFontSize, 120);
    lines.forEach((line) => {
      page.drawText(line, {
        x: nameXPos - ( textFont.widthOfTextAtSize(line, nameFontSize) / 2 ),
        y: nameYPos,
        size: nameFontSize,
        font: textFont,
        color: rgb(1, 1, 1),
      });
        nameYPos -= nameFontSize + 5;
      }
    )
  } 

  // 4) Save the output PDF to a file
  const pdfBytes = await outPdf.save();
  fs.writeFileSync("output.pdf", pdfBytes);
  console.log("Created output.pdf with all QR codes!");
}

// Main function
async function main() {
    await connectDb();

    // TARGET EVENT
    const event_id = "6787155662af0eaf6df647c1";

    // 1) Get target event
    const event = await Event.findOne({ _id: event_id}).populate(
      "registrants.user"
    );
    
    // 2) Generate QR for selected registrants
    const QRs = await Promise.all(event.registrants.filter(
      registrant => registrant.selected
    ).map(
      async (registrant) => {
        return { 
          id: registrant.user._id.toString(),
          name: registrant.user.username.toString(),
          // name: "Chow Sheng Liang AJ",
          eventArray: [
            {
              id: event._id.toString(),
              secret: await bcrypt.hash(registrant.user + process.env.ACCESS_TOKEN_SECRET + event.secretName, 10)
            }
          ] 
        }
    }));

    // 3) Create PDF
    createPdfWithQRCodes(QRs)
      .catch(err => console.error(err));

    await mongoose.disconnect();
}

main();
