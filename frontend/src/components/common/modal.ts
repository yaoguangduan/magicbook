import {h, ref} from 'vue'
import {Input, InputPassword, Modal} from "@arco-design/web-vue";

interface InputModalConfig {
    placeholder?: string
    type?: 'text' | 'password'
    width?: number,
    okText?: string
}

export const showInput = (config: InputModalConfig = {}): Promise<string | undefined> => {
    const inputValue = ref('')
    const refInput = ref()

    return new Promise((resolve) => {
        const modal = Modal.open({
            width: config.width || 300,
            okText: config.okText || '确定',
            content: () => config.type === 'password' ? h(InputPassword, {
                placeholder: config.placeholder,
                ref: refInput,
                modelValue: inputValue.value,
                'onUpdate:modelValue': (val: string) => {
                    inputValue.value = val
                }
            }) : h(Input, {
                placeholder: config.placeholder,
                ref: refInput,
                modelValue: inputValue.value,
                'onUpdate:modelValue': (val: string) => {
                    inputValue.value = val
                }
            }),
            hideTitle: true,
            onOpen: () => {
                setTimeout(() => {
                    if (refInput.value) {
                        refInput.value.focus()
                    }
                }, 0)
            },
            onOk: () => {
                resolve(inputValue.value)
                modal.close()
            },
            onCancel: () => {
                resolve(undefined)
                modal.close()
            }
        })
    })
}
