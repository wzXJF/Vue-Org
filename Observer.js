class Watcher {
  constructor(vm, expr, cb) {
    this.vm = vm
    this.expr = expr
    this.cb = cb
    this.oldVal = this.getOldVal()
  }
  getOldVal() {
    Dep.target = this
    const oldVal = compileUtil.getVal(this.expr, this.vm)
    Dep.target = null
    return oldVal
  }
  update() {
    const newVal = compileUtil.getVal(this.expr, this.vm)
    if (newVal != this.oldVal) {
      this.cb(newVal)
    }
  }
}

class Dep {
  constructor() {
    this.subs = []
  }
  // 收集观察者
  addSub(watcher) {
    this.subs.push(watcher)
  }
  // 通知观察者去更新
  noty() {
    this.subs.forEach(w => w.update())
    console.log(this.subs)
  }
}

class Observer {
  constructor(data) {
    this.observer(data)
  }
  observer(data) {
    if (data && typeof data === 'object') {
      Object.keys(data).forEach(key => {
        this.defineReactive(data, key, data[key])
      })
    }
  }

  defineReactive(data, key, value) {
    // 递归遍历
    this.observer(value)
    const dep = new Dep()
    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: true,
      get() {
        // 订阅数据变化时，向Dep中添加观察者
        Dep.target && dep.addSub(Dep.target)
        return value
      },
      set: newValue => {
        this.observer(newValue)
        if (value !== newValue) {
          value = newValue
        }
        // 告诉Dep通知变化
        dep.noty()
      }
    })
  }
}
