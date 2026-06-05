import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import router from './router';
import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';

function App() {
  const initData = useAppStore(state => state.initData);

  useEffect(() => {
    initData();
  }, [initData]);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#165DFF',
          colorInfo: '#165DFF',
          colorSuccess: '#00B42A',
          colorWarning: '#FF7D00',
          colorError: '#F53F3F',
          borderRadius: 8,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App;
