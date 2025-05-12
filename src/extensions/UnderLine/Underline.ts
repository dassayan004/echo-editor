import type { UnderlineOptions as TiptapUnderlineOptions } from '@tiptap/extension-underline'
import TiptapUnderline from '@tiptap/extension-underline'
import ActionButton from '@/components/ActionButton.vue'

import type { GeneralOptions } from '@/type'

export interface UnderlineOptions extends TiptapUnderlineOptions, GeneralOptions<UnderlineOptions> { }

export const Underline = TiptapUnderline.extend<UnderlineOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      button({ editor, t }) {
        return {
          component: ActionButton,
          componentProps: {
            action: () => editor.chain().toggleUnderline().focus().run(),
            isActive: () => editor.isActive('underline') || false,
            disabled: !editor.isEditable || !editor.can().toggleUnderline(),
            icon: 'Underline',
            shortcutKeys: ['mod', 'U'],
            tooltip: t('editor.underline.tooltip'),
          },
        }
      },
    }
  },
})
