// src/components/LoginModal.tsx
import React, { useState } from 'react';
import { Dialog } from "radix-ui";
import { createRoot } from 'react-dom/client';

// ========== 类型定义 ==========
interface LoginModalOptions {
  onLogin: (credentials: { username: string; password: string }, call: any) => void;
}

interface LoginModalComponentProps extends LoginModalOptions {
  open: boolean;
  onClose: () => void;
}

// ========== 弹窗内部组件 ==========
const LoginModalComponent: React.FC<LoginModalComponentProps> = ({
  open,
  onClose,
  onLogin,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onLogin({ username, password }, (flag: boolean) => {
      setLoading(false);
      if (flag) {
        onClose();
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md p-6 bg-white rounded-xl shadow-xl z-[10000] focus:outline-none">
          <Dialog.Title className="text-xl font-bold text-gray-800 mb-2">登录</Dialog.Title>
          <Dialog.Description className="text-sm text-gray-600 mb-4">
            请输入您的账号和密码
          </Dialog.Description>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                账号
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入账号"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入密码"
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-75 flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    登录中...
                  </>
                ) : (
                  '登录'
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// ========== 动态挂载工具 ==========
let modalRoot: any = null;
let container: HTMLElement | null = null;

function mountModal(element: React.ReactElement): () => void {
  if (!container) {
    container = document.createElement('div');
    container.setAttribute('data-login-modal-container', '');
    document.body.appendChild(container);
  }

  if (!modalRoot) {
    modalRoot = createRoot(container);
  }

  modalRoot.render(element);

  return () => {
    if (modalRoot) {
      modalRoot.unmount();
      modalRoot = null;
    }
    if (container) {
      document.body.removeChild(container);
      container = null;
    }
  };
}

// ========== 导出命令式 API ==========
export const LoginModal = {
  show(options: LoginModalOptions) {
    let unmount: (() => void) | null = null;

    const handleClose = () => {
      if (unmount) {
        unmount();
        unmount = null;
      }
    };

    const element = (
      <LoginModalComponent
        open={true}
        onClose={handleClose}
        onLogin={(creds, call) => {
          options.onLogin(creds, call);
        }}
      />
    );

    unmount = mountModal(element);
  },
};