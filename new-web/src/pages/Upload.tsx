import { TextField } from '@mui/material'
import React, { useState } from 'react'

import FileInput from '../components/FileInput'
import PageLayout from '../components/PageLayout'
import StyledForm from '../components/StyledForm'
import ProjectRepository from '../repositories/ProjectRepository'
import LoadingPage from './LoadingPage'

export default function Upload (): JSX.Element {
  document.title = 'Upload | docat'

  const [project, setProject] = useState<string>('')
  const [version, setVersion] = useState<string>('')
  const [file, setFile] = useState<File | undefined>(undefined)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadSuccess, setUploadSuccess] = useState<boolean | null>(null)
  const [validation, setValidation] = useState<{
    projectMsg?: string
    versionMsg?: string
    validateFileNow?: boolean
  }>({})

  function validateInput (inputName: string, value: string): boolean {
    const validationProp = `${inputName}Msg` as keyof typeof validation

    if (value.trim() === '') {
      const input = inputName.charAt(0).toUpperCase() + inputName.slice(1)
      const validationMsg = `${input} is required`

      setValidation({
        ...validation,
        [validationProp]: validationMsg
      })
      return false
    } else {
      setValidation({
        ...validation,
        [validationProp]: undefined
      })
      return true
    }
  }

  function validateFile (): boolean {
    setValidation({ ...validation, validateFileNow: true })

    // make ready for another validation
    setTimeout(() => {
      setValidation({ ...validation, validateFileNow: false })
    }, 1000)

    return file !== undefined
  }

  async function upload (): Promise<void> {
    if (!validateInput('project', project)) return
    if (!validateInput('version', version)) return
    if (!validateFile() || file === undefined) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      await ProjectRepository.upload(project, version, formData)

      // reset the form
      setProject('')
      setVersion('')
      setFile(undefined)
      setValidation({})
      setUploadSuccess(true)
    } catch (e) {
      console.error(e)
      setUploadSuccess(false)
    } finally {
      setTimeout(() => setUploadSuccess(null), 5000)
      setIsUploading(false)
    }
  }

  if (isUploading) {
    return <LoadingPage />
  }

  const description = (
    <p>
      If you want to automate the upload of your documentation consider using{' '}
      <code>curl</code> to post it to the server. There are some examples in the{' '}
      <a
        href="https://github.com/docat-org/docat/"
        target="_blank"
        rel="noreferrer"
      >
        docat repository
      </a>
      .
    </p>
  )

  return (
    <PageLayout
      errorMsg={
        uploadSuccess === false ? 'Failed to upload documentation.' : ''
      }
      successMsg={
        uploadSuccess === true ? 'Documentation uploaded successfully.' : ''
      }
      title="Upload Documentation"
      description={description}
    >
      <StyledForm>
        <TextField
          fullWidth
          autoComplete="off"
          label="Project"
          value={project}
          onChange={(e) => {
            const project = e.target.value
            setProject(project)
            validateInput('project', project)
          }}
          error={validation.projectMsg !== undefined}
          helperText={validation.projectMsg}
        >
          {project}
        </TextField>

        <TextField
          fullWidth
          autoComplete="off"
          label="Version"
          value={version}
          onChange={(e) => {
            const version = e.target.value
            setVersion(version)
            validateInput('version', version)
          }}
          error={validation.versionMsg !== undefined}
          helperText={validation.versionMsg}
        >
          {version}
        </TextField>

        <FileInput
          label="Zip File"
          file={file}
          onChange={(file) => setFile(file)}
          okTypes={[
            'application/zip',
            'zip',
            'application/octet-stream',
            'application/x-zip',
            'application/x-zip-compressed'
          ]}
          validateNow={validation.validateFileNow === true}
        ></FileInput>

        <button type="submit" onClick={() => {
          (async () => {
            await upload()
          })().catch(console.error)
        }}>
          Upload
        </button>
      </StyledForm>
    </PageLayout>
  )
}
