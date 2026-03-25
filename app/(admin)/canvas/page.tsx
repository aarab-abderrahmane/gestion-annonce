import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Palette } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Canvas - لوحة الإنشاء',
  description: 'أدوات إنشاء المحتوى التعليمي',
};

export default function CanvasPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">لوحة الإنشاء</h1>
          <p className="text-gray-600">أدوات إنشاء وإدارة المحتوى التعليمي</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Timetable Creator Card */}
          <Link href="/canvas/timetable">
            <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-8 cursor-pointer border-2 border-transparent hover:border-blue-500">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  جدول الحصص
                </h2>
                <p className="text-gray-600 mb-4">
                  إنشاء وتعديل جداول الحصص الدراسية
                </p>
                <div className="text-sm text-gray-500">
                  • إضافة وتعديل الحصص
                  <br />
                  • حساب الساعات تلقائياً
                  <br />
                  • تصدير كصورة أو PDF
                </div>
              </div>
            </div>
          </Link>

          {/* Graphic Designer Card */}
          <Link href="/canvas/designer">
            <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-8 cursor-pointer border-2 border-transparent hover:border-purple-500">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Palette className="w-10 h-10 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  مصمم الإعلانات
                </h2>
                <p className="text-gray-600 mb-4">
                  تصميم الإعلانات والمحتوى المرئي
                </p>
                <div className="text-sm text-gray-500">
                  • إضافة نصوص وصور
                  <br />
                  • قوالب جاهزة
                  <br />
                  • تصدير بجودة عالية
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-gray-900 mb-4">النشاط الأخير</h3>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-center py-8">
              لا توجد عناصر محفوظة حالياً
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
