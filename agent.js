/**
 * liveload
 */
'use strict';

const path = require('path');
const tinylr = require('tiny-lr');
const EventEmitter = require('events').EventEmitter;

module.exports = function(agent) {
  const logger = agent.logger;
  const baseDir = agent.config.baseDir;
  const config = agent.config.development;
  const liveload = agent.config.liveload;
  const emitter = new EventEmitter();
  const watchDirs = [
    'app',
    'config',
    'mocks',
    'mocks_proxy',
  ].concat(config.watchDirs).map(dir => path.join(baseDir, dir));

  const ignoreReloadFileDirs = [
    'app/views',
    'app/assets',
    'app/public',
  ].concat(config.ignoreDirs).map(dir => path.join(baseDir, dir));

  //启动 liveload server
  let server = null;
  function startServer() {
    // 启动一个liveload
    var port = liveload.port;
    server = new tinylr();
    server.listen(port, function(err) {
      if (err) { throw err; }
      console.log('... Starting Livereload server on ' + port);
    });
  }

  // 开发模式下监听 App 的几个主要的代码目录
  // 监听目录变化，通知liveload(借鉴了egg-development)
  agent.watcher.watch(watchDirs, reloadWorker);

  /*
    文件改变 重启woker这个在egg-develoment已经做了
    所我要做的是当前端资源文件改变时liveload
    后端文件改变导致的reload-worker成功后通知liveload
  */
  function reloadWorker(info) {
    // egg-bin debug 不 reload
    if (process.env.EGG_DEBUG) {
      return;
    }
    // 不是文件需要过滤
    if(!info.isFile) {
      return;
    }
    // 过滤静态文件变化
    if (isAssetsDir(info.path)) {
      // 前端文件 直接 刷新
      server.notifyClients([info.path]);
      return;
    }
  }
  //todo 优化, 理论上要这里需要知道app woker 重启成功,但是没有看到有事件上抛 所以自己mock
  process.on('message', msg => {
    if (typeof msg === 'string') msg = { action: msg, data: msg };
    msg.from = 'agent';
    emitter.emit(msg.action, msg.data);
  });

  emitter.once('egg-ready',(opts) => {
    const workerNum = opts.workers;
    emitter.on('egg-pids', (data) => {
      // 只能通过worker的个数做判断是否最终启动成功
      if(data instanceof Array && data.length === workerNum) {
        logger.error(data);
        server.notifyClients(["*"]);
      }
    })
  });

  // 检测是否是排除 reload 的文件路径
  function isAssetsDir(path) {
    for (const ignorePath of ignoreReloadFileDirs) {
      if (path.startsWith(ignorePath)) {
        return true;
      }
    }
    return false;
  }

  //服务启动
  startServer();
};
