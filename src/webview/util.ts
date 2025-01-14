import JSZip from 'jszip'
import { fileSave } from 'browser-fs-access'
import { ShapeExportResult } from './types'

const EXTS = new Map([
  ['stl-binary', 'stl'],
  ['step-assembly', 'step'],
])
const mapExt = (ext: string) => EXTS.get(ext) ?? ext

export default async function saveShapes(shape: ShapeExportResult, bundleCode = false) {
  const {
    fileType,
    code,
    name,
    params,
    shapes,
  } = shape

  const ext = mapExt(fileType)
  if (shapes.length === 1) {
    const { blob } = shapes[0]
    const shapeName = shapes[0].name || name || `shape`
    if (bundleCode) {
      const zip = new JSZip()
      zip.file(`${shapeName}.js`, code)
      zip.file(`${shapeName}.json`, JSON.stringify(params, null, 2))
      zip.file(`${shapeName}.${ext}`, blob)
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      await fileSave(zipBlob, {
        id: 'exports',
        description: 'Save zip',
        fileName: `${shapeName}.zip`,
        extensions: ['.zip'],
      })
    } else {
      await fileSave(blob, {
        description: `Save ${shapeName}.${ext} as ${fileType}`,
        fileName: `${shapeName}.${ext}`,
        extensions: [`.${ext}`],
      })
    }
    return
  }

  const shapeName = name || 'shape'
  const zip = new JSZip()
  if (bundleCode) {
    zip.file(`${shapeName}.js`, code)
    zip.file(`${shapeName}.json`, JSON.stringify(params, null, 2))
  }
  shapes.forEach((shape, i) => {
    const name = shape.name || `${shapeName}-${i}`
    zip.file(`${name}.${ext}`, shape.blob)
  })
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  await fileSave(zipBlob, {
    id: 'exports',
    description: 'Save zip',
    fileName: `${shapeName}.zip`,
    extensions: ['.zip'],
  })
}
