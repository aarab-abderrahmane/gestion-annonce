'use client';

import { useState } from 'react';
import { 
  Type, 
  Square, 
  Image as ImageIcon, 
  Download, 
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

export default function DesignerPage() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  return (
    <div className="h-screen flex" dir="rtl">
      {/* Right Sidebar - Properties Panel */}
      <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <h3 className="font-bold text-lg mb-4">الخصائص</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">عرض اللوحة</label>
            <input
              type="number"
              defaultValue={800}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">ارتفاع اللوحة</label>
            <input
              type="number"
              defaultValue={600}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">لون الخلفية</label>
            <input
              type="color"
              defaultValue="#ffffff"
              className="w-full h-10 border border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Center Canvas Area */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-3 flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded" title="تراجع">
            <Undo className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded" title="إعادة">
            <Redo className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          <button className="p-2 hover:bg-gray-100 rounded" title="تكبير">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded" title="تصغير">
            <ZoomOut className="w-5 h-5" />
          </button>
          
          <div className="flex-1" />
          
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
            <Save className="w-4 h-4" />
            حفظ
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2">
            <Download className="w-4 h-4" />
            تحميل
          </button>
        </div>

        {/* Canvas Workspace */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
          <div className="bg-white shadow-lg" style={{ width: '800px', height: '600px' }}>
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <p>اللوحة الفارغة - اختر أداة من الشريط الجانبي للبدء</p>
            </div>
          </div>
        </div>
      </div>

      {/* Left Sidebar - Tools Panel */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <h3 className="font-bold text-lg mb-4">الأدوات</h3>
        
        {/* Elements Section */}
        <div className="mb-6">
          <h4 className="font-semibold text-sm mb-3 text-gray-700">العناصر</h4>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedTool('text')}
              className={`w-full flex items-center gap-3 p-3 rounded hover:bg-gray-100 ${
                selectedTool === 'text' ? 'bg-blue-50 border border-blue-300' : ''
              }`}
            >
              <Type className="w-5 h-5" />
              <span>نص</span>
            </button>
            
            <button
              onClick={() => setSelectedTool('shape')}
              className={`w-full flex items-center gap-3 p-3 rounded hover:bg-gray-100 ${
                selectedTool === 'shape' ? 'bg-blue-50 border border-blue-300' : ''
              }`}
            >
              <Square className="w-5 h-5" />
              <span>شكل</span>
            </button>
            
            <button
              onClick={() => setSelectedTool('image')}
              className={`w-full flex items-center gap-3 p-3 rounded hover:bg-gray-100 ${
                selectedTool === 'image' ? 'bg-blue-50 border border-blue-300' : ''
              }`}
            >
              <ImageIcon className="w-5 h-5" />
              <span>صورة</span>
            </button>
          </div>
        </div>

        {/* Templates Section */}
        <div>
          <h4 className="font-semibold text-sm mb-3 text-gray-700">القوالب</h4>
          <div className="space-y-2">
            <button className="w-full text-right p-3 rounded hover:bg-gray-100 border border-gray-200">
              إعلان بسيط
            </button>
            <button className="w-full text-right p-3 rounded hover:bg-gray-100 border border-gray-200">
              ملصق حدث
            </button>
            <button className="w-full text-right p-3 rounded hover:bg-gray-100 border border-gray-200">
              نشرة إخبارية
            </button>
            <button className="w-full text-right p-3 rounded hover:bg-gray-100 border border-gray-200">
              جدول امتحانات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
