import { EditorState, Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet, EditorView } from '@tiptap/pm/view'

const uploadKey = new PluginKey('upload-image')

interface UploadAction {
  add?: Array<{ id: string; pos: number; src: string }>
  remove?: string[]
}

export const UploadImagesPlugin = () =>
  new Plugin({
    key: uploadKey,
    state: {
      init() {
        return DecorationSet.empty
      },
      apply(tr, set) {
        set = set.map(tr.mapping, tr.doc)
        const action = tr.getMeta(uploadKey) as UploadAction

        if (action?.add) {
          action.add.forEach(({ id, pos, src }) => {
            const placeholder = createPlaceholder(src)
            const deco = Decoration.widget(pos, placeholder, { id })
            set = set.add(tr.doc, [deco])
          })
        } else if (action?.remove) {
          action.remove.forEach(id => {
            set = set.remove(set.find(undefined, undefined, spec => spec.id === id))
          })
        }

        return set
      },
    },
    props: {
      decorations(state) {
        return this.getState(state)
      },
    },
  })

function createPlaceholder(src: string): HTMLElement {
  const placeholder = document.createElement('div')
  const image = document.createElement('img')
  image.setAttribute('class', 'opacity-50')
  image.src = src
  image.onload = () => {
    placeholder.setAttribute('class', 'img-placeholder')
  }
  placeholder.appendChild(image)
  return placeholder
}

function findPlaceholder(state: EditorState, id: string): number | null {
  const decos = uploadKey.getState(state) as DecorationSet
  const found = decos.find(undefined, undefined, spec => spec.id === id)
  return found.length ? found[0]?.from : null
}

export interface ImageUploadOptions {
  validateFn?: (file: File) => boolean
  onUpload: (file: File) => Promise<string | object>
}

export type UploadFn = (files: File[], view: EditorView, pos: number) => void

export const createImageUpload =
  ({ validateFn, onUpload }: ImageUploadOptions): UploadFn =>
  (files, view, pos) => {
    files.forEach(file => {
      if (validateFn && !validateFn(file)) return

      const id = Date.now().toString()
      const tr = view.state.tr
      if (!tr.selection.empty) tr.deleteSelection()

      const result = URL.createObjectURL(file)
      tr.setMeta(uploadKey, {
        add: [{ id, pos, src: result }],
      })
      view.dispatch(tr)

      onUpload(file).then(
        src => {
          const { schema } = view.state
          const placeholderPos = findPlaceholder(view.state, id)
          if (placeholderPos === null) return

          const imageSrc = typeof src === 'object' ? result : src
          const node = schema.nodes.image?.create({ src: imageSrc })
          if (!node) return

          const transaction = view.state.tr
            .replaceWith(placeholderPos, placeholderPos, node)
            .setMeta(uploadKey, { remove: [id] })
          view.dispatch(transaction)
        },
        () => {
          const transaction = view.state.tr.delete(pos, pos).setMeta(uploadKey, { remove: [id] })
          view.dispatch(transaction)
        }
      )
    })
  }

export const handleImagePaste = (view: EditorView, event: ClipboardEvent, uploadFn: UploadFn): boolean => {
  const files = Array.from(event.clipboardData?.files || [])
  if (files.length) {
    event.preventDefault()
    const pos = view.state.selection.from
    uploadFn(files, view, pos + 1)
    return true
  }
  return false
}

export const handleImageDrop = (view: EditorView, event: DragEvent, moved: boolean, uploadFn: UploadFn): boolean => {
  const files = Array.from(event.dataTransfer?.files || [])
  if (!moved && files.length) {
    event.preventDefault()
    const coordinates = view.posAtCoords({
      left: event.clientX,
      top: event.clientY,
    })
    if (coordinates) {
      uploadFn(files, view, coordinates.pos + 1)
      return true
    }
  }
  return false
}
