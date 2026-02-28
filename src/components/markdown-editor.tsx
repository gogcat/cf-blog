import dynamic from 'next/dynamic'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

interface MDEditorProps {
  value: string
  onChange: (value: string | undefined) => void
  placeholder?: string
  height?: number
}

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
) as React.ComponentType<MDEditorProps>

export default MDEditor
