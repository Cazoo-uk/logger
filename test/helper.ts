import split from 'split2'

export function sink(raw: boolean = false) {
    if (raw){
        return split()
    }
    return split(JSON.parse)
}

export function once(emitter, name) {
  return new Promise((resolve, reject) => {
    if (name !== 'error') emitter.once('error', reject)
    emitter.once(name, (...args) => {
      emitter.removeListener('error', reject)
      resolve(...args)
    })
  })
}
