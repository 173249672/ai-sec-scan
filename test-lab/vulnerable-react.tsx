import React from 'react';

export const UserProfile = ({ user }) => {
  const handleSave = () => {
    // 漏洞 1: 路径穿越与敏感文件写入
    const fs = require('fs');
    fs.writeFile(`./configs/${user.id}.json`, JSON.stringify(user), (err) => {
      if (err) console.error(err);
    });
  };

  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      {/* 漏洞 2: XSS 风险 */}
      <div dangerouslySetInnerHTML={{ __html: user.bio }} />
      
      {/* 漏洞 3: 动态执行恶意字符串 */}
      <button onClick={() => eval(user.customScript)}>
        Execute Custom Script
      </button>
      
      <button onClick={handleSave}>Save Config</button>
    </div>
  );
};
