import { CloudArrowDown } from 'react-bootstrap-icons'
import Button from 'react-bootstrap/esm/Button'
import Container from 'react-bootstrap/esm/Container'
import Nav from 'react-bootstrap/esm/Nav'
import Navbar from 'react-bootstrap/esm/Navbar'
import Form from 'react-bootstrap/esm/Form'

import { ShapeMeshResult } from '../types'

type DownloadButtonProps = {
  setShowDialog: React.Dispatch<React.SetStateAction<boolean>>
}

const DownloadButton = ({
  setShowDialog,
}: DownloadButtonProps) => {
  const onClick = () => setShowDialog(true)

  return (
    // @ts-ignore
    <Button
      variant='primary'
      onClick={onClick}
    >
      <CloudArrowDown
        className='icon-dl'
        focusable='false'
        aria-hidden='true'
      />
    </Button>
  )
}

type SelectedShapesDropdownProps = {
  shapes: ShapeMeshResult
  setSelected: React.Dispatch<React.SetStateAction<number | null>>
}

const SelectedShapesDropdown = ({
  shapes,
  setSelected,

}: SelectedShapesDropdownProps) => {
  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = e.target.value ? parseInt(e.target.value) : null
    setSelected(index)
  }

  return (
    <Form.Select onChange={onChange}>
      <option value=''>All Shapes</option>
      {shapes.shapes.map((shape, index) => (
        <option key={index} value={index}>
          {shape.name ?? `Shape ${index + 1}`}
        </option>
      ))}
    </Form.Select>
  )
}

type ToolbarViewProps = {
  shapes: ShapeMeshResult
  setSelected: React.Dispatch<React.SetStateAction<number | null>>
  setShowDialog: React.Dispatch<React.SetStateAction<boolean>>
}

export default ({
  shapes,
  setSelected,
  setShowDialog,
}: ToolbarViewProps) => {
  return (
    <Navbar>
      <Container fluid>
        <Navbar.Collapse>
          <Nav className='d-flex w-100'>
            <Nav.Item className='d-flex'>
              <SelectedShapesDropdown
                shapes={shapes}
                setSelected={setSelected}
              />
            </Nav.Item>
            <div className='flex-fill' />
            <Nav.Item className='d-flex'>
              <DownloadButton
                setShowDialog={setShowDialog}
              />
            </Nav.Item>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
