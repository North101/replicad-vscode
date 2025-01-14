import { useState } from 'react'
import Button from 'react-bootstrap/esm/Button'
import Form from 'react-bootstrap/esm/Form'
import Modal from 'react-bootstrap/esm/Modal'
import Stack from 'react-bootstrap/esm/Stack'

import builderAPI from '../builderAPI'
import saveShapes from '../util'
import { FileType } from './App'

const fileTypes = [
  { id: 'step', label: 'STEP' },
  { id: 'step-assembly', label: 'STEP assembly' },
  { id: 'stl', label: 'STL' },
  { id: 'stl-binary', label: 'STL (binary)' },
  { id: 'json', label: 'JSON' },
]

type DownloadModalProps = {
  file: FileType | null
  setShowDialog: React.Dispatch<React.SetStateAction<boolean>>
}

export default ({ file, setShowDialog }: DownloadModalProps) => {
  const [fileType, setFileType] = useState('stl')
  const [bundleCode, setBundleCode] = useState(false)

  const onFileTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.checked) return

    setFileType(e.target.id)
  }

  const onBundleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBundleCode(e.target.checked)
  }

  const onDownload = async () => {
    if (!file) return

    await builderAPI.ready()
    const shapes = await builderAPI.exportShape(file.fileName, fileType)
    await saveShapes(shapes, bundleCode)
    setShowDialog(false)
  }

  const onClose = () => setShowDialog(false)

  return (
    <Modal centered show onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Save Model</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Stack>
            {fileTypes.map((e) => (
              <Form.Check
                key={e.id}
                type='radio'
                name='fileType'
                id={e.id}
                label={e.label}
                checked={fileType == e.id}
                onChange={onFileTypeChange}
              />
            ))}
          </Stack>
        </Form>
        <Form.Check
          type='checkbox'
          id='bundleCode'
          label='Include code'
          checked={bundleCode}
          onChange={onBundleChange}
        />
      </Modal.Body>

      <Modal.Footer>
        <Button variant='secondary' onClick={onClose}>
          Close
        </Button>
        <Button variant='primary' onClick={onDownload}>
          Download
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
