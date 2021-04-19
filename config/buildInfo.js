/**
 * @author:lpf
 * @flow
 *
 **/
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

function getGitInfo(workPath) {
  const gitPath = path.resolve(workPath, '.git');
  if (fs.existsSync(gitPath)) {
    let ret = { branch: '', commit: '', date: '', message: '' };
    let gitInfo = '';
    try {
      gitInfo = child_process
        .execSync(
          `git log -1 --date=iso  --pretty=format:"{'commit':'%H', 'date':'%ad', 'message':'%s'}"`
        )
        .toString();
      gitInfo = gitInfo.replace(/\'/g, '"');
      ret = Object.assign(ret, JSON.parse(gitInfo));
      const gitHEAD = fs
        .readFileSync(path.resolve(gitPath, 'HEAD'), 'utf-8')
        .trim();
      // �ݲ���ʾgit registry��Ϣ
      // const config = fs.readFileSync(path.resolve(gitPath,'config'), 'utf-8').trim();
      // const regUrl = /url = ([\S]+)/;
      // const regRet = regUrl.exec(config);
      // if (regRet[1]) {
      //     ret.gitRepository = regRet[1];
      // }
      ret.branch = gitHEAD.split('/')[2];
      return ret;
    } catch (e) {
      console.log('readerBuildInfoErr:', e);
      throw e;
    }
  } else {
    return { branch: '', commit: '', date: '', message: '' };
  }
}
module.exports = {
  getGitInfo: getGitInfo,
};
