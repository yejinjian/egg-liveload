# egg-liveload

liveload plugin for Egg.

提供功能:
- 前端静态资源改变时会触发liveload
- 后端改版时先触发egg-development中的worker-reload 重启成功后 触发liveload 自动刷新页面

---

## Install

```bash
$ npm i egg-liveload
```

## Configuration

添加配置到 `config/plugin.js`

```js
exports.liveload = {
  enable: true,
  package: 'egg-liveload'
};
```

## Todo

- egg-cluster中没有触发 worker-load成功后的事件,我只能自己用egg-pids自己模拟
- worker reload 还是太慢了, 稍后仔细研读代码.

## Tanks

借鉴了 [koa-liveload](https://github.com/chemzqm/koa-liveload) 在此感谢.
很细换egg中的新起线程然后关闭旧线程 来替换node重启的思想,虽然这个很早就有,但是做的好的不多, 希望egg 越来越好

## License

MIT