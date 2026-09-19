import { useState } from 'react'

function App() {
  const [activeTab, setActiveTab] = useState('dss')

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">DSS AI Purchase</h1>
          <p className="text-xs text-gray-500 mt-1">Retail Store Decision Support</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            <li>
              <button 
                onClick={() => setActiveTab('dss')}
                className={`w-full text-left px-3 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'dss' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Bảng Đề Xuất DSS
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('po')}
                className={`w-full text-left px-3 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'po' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Quản Lý Đơn Mua
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full text-left px-3 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'settings' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Cấu Hình Tham Số
              </button>
            </li>
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              AD
            </div>
            <div>
              <p className="text-sm font-medium">Store Manager</p>
              <p className="text-xs text-gray-500">admin@dss.local</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-800">
            {activeTab === 'dss' && 'Bảng Đề Xuất DSS'}
            {activeTab === 'po' && 'Quản Lý Đơn Mua Hàng'}
            {activeTab === 'settings' && 'Cấu Hình Tham Số Hệ Thống'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              API Connected
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Frontend Shell Ready!</h3>
            <p className="text-gray-500 max-w-md">
              Giao diện React + Vite đã được khởi tạo thành công cùng TailwindCSS. 
              Sẵn sàng cho việc ghép API từ Backend và phát triển tính năng ở Giai đoạn 7.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
