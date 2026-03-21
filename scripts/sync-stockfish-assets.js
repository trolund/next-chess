const fs = require("fs")
const path = require("path")

const projectRoot = path.resolve(__dirname, "..")
const sourceDir = path.join(projectRoot, "node_modules", "stockfish", "bin")
const targetDir = path.join(projectRoot, "public", "vendor", "stockfish")

const filesToCopy = [
    "stockfish-18-lite-single.js",
    "stockfish-18-lite-single.wasm"
]

fs.mkdirSync(targetDir, { recursive: true })

for (const fileName of filesToCopy) {
    const source = path.join(sourceDir, fileName)
    const target = path.join(targetDir, fileName)

    if (!fs.existsSync(source)) {
        throw new Error(`Missing Stockfish asset: ${source}`)
    }

    fs.copyFileSync(source, target)
}

const licenseSource = path.join(projectRoot, "node_modules", "stockfish", "Copying.txt")
const licenseTarget = path.join(targetDir, "Copying.txt")

if (fs.existsSync(licenseSource)) {
    fs.copyFileSync(licenseSource, licenseTarget)
}

console.log(`Synced Stockfish assets to ${targetDir}`)
