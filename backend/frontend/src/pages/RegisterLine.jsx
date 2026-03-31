import { useNavigate } from 'react-router-dom';
import { ShieldCheck, MessageCircle, Link, KeyRound, Check } from 'lucide-react';

export default function RegisterLine() {
  const navigate = useNavigate();

  const handleRegister = () => {
    // In a real app, this would redirect to LINE Login Auth URL
    alert('Redirecting to LINE Authorization...');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      
      {/* Top Banner section */}
      <div className="bg-[#00B900] w-full py-10 px-4 md:py-16 text-center text-white relative overflow-hidden">
        {/* Soft decorative circles */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 animate-fade-in">
          <h1 className="text-2xl md:text-4xl font-bold mb-4 leading-tight">
            เพื่อให้ระบบสามารถเชื่อมต่อกับ LINE Official Account ได้ในครั้งแรก<br className="hidden md:block"/>
            โปรดกดปุ่ม "อนุญาต" และ "ตกลง" ในหน้าถัดไปทั้ง 3 หน้า
          </h1>
          <p className="text-green-50 text-base md:text-lg max-w-2xl mx-auto">
            เพื่อความสมบูรณ์ในการดึงแชทและแจ้งเตือนเข้าสู่ระบบของเรา กรุณาทำตามขั้นตอนด้านล่าง
          </p>
        </div>
      </div>

      {/* Main Content (Steps) */}
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-12 md:py-16">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 animate-fade-in-up">
          
          {/* Step 1 */}
          <div className="flex flex-col items-center group">
            <div className="w-full bg-gray-50 rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6 group-hover:shadow-md group-hover:border-[#00B900]/30 transition-all duration-300 transform group-hover:-translate-y-1">
              <div className="bg-[#00B900] text-white py-2 px-4 flex items-center gap-2 text-sm font-bold">
                <MessageCircle size={16} fill="currentColor" /> LINE Login
              </div>
              <div className="p-6 md:p-8 flex flex-col items-center text-center h-48 justify-center bg-white">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-[#00B900]">
                  <ShieldCheck size={32} />
                </div>
                <p className="text-sm text-gray-700 font-medium">ระบบจะได้รับข้อมูลโปรไฟล์และอีเมลของคุณ เพื่อสร้างบัญชี</p>
              </div>
              <div className="bg-gray-100 p-3 flex justify-end gap-2 border-t border-gray-200">
                <div className="bg-gray-300 text-gray-500 px-4 py-1.5 rounded text-xs font-bold cursor-not-allowed">ยกเลิก</div>
                <div className="bg-[#00B900] text-white px-4 py-1.5 rounded text-xs font-bold shadow-sm">อนุญาต</div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-[#00B900] mb-2">STEP 1</h3>
            <p className="text-center text-gray-600 font-medium">เชื่อมต่อข้อมูลพื้นฐานของคุณ<br/>(โปรไฟล์และอีเมล)</p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center group" style={{animationDelay: '100ms'}}>
            <div className="w-full bg-gray-50 rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6 group-hover:shadow-md group-hover:border-[#00B900]/30 transition-all duration-300 transform group-hover:-translate-y-1">
              <div className="bg-[#00B900] text-white py-2 px-4 flex items-center gap-2 text-sm font-bold">
                <MessageCircle size={16} fill="currentColor" /> LINE Login
              </div>
              <div className="p-6 md:p-8 flex flex-col items-center text-center h-48 justify-center bg-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <MessageCircle size={24} />
                  </div>
                  <Link size={20} className="text-gray-300" />
                  <div className="w-12 h-12 bg-[#00B900]/10 text-[#00B900] rounded-xl flex items-center justify-center">
                    <MessageCircle size={24} fill="currentColor" />
                  </div>
                </div>
                <p className="text-sm text-gray-700 font-medium">ระบบต้องการส่งข้อความตอบกลับ<br/>ในนามของ LINE Official Account</p>
              </div>
              <div className="bg-gray-100 p-3 flex justify-end gap-2 border-t border-gray-200">
                <div className="bg-gray-300 text-gray-500 px-4 py-1.5 rounded text-xs font-bold cursor-not-allowed">ไม่ใช่ตอนนี้</div>
                <div className="bg-[#00B900] text-white px-4 py-1.5 rounded text-xs font-bold shadow-sm">ตกลง</div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-[#00B900] mb-2">STEP 2</h3>
            <p className="text-center text-gray-600 font-medium">อนุญาตให้ระบบตอบลูกค้าได้ดึงแชท<br/>และบรอดแคสต์ข้อความ</p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center group" style={{animationDelay: '200ms'}}>
            <div className="w-full bg-gray-50 rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6 group-hover:shadow-md group-hover:border-[#00B900]/30 transition-all duration-300 transform group-hover:-translate-y-1">
              <div className="bg-[#00B900] text-white py-2 px-4 flex items-center gap-2 text-sm font-bold">
                <MessageCircle size={16} fill="currentColor" /> LINE Login
              </div>
              <div className="p-6 md:p-8 flex flex-col items-center text-center h-48 justify-center bg-white">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-500 border-4 border-amber-100">
                  <KeyRound size={28} />
                </div>
                <p className="text-sm text-gray-700 font-medium">ระบบต้องการออก Access Token เพื่อใช้เชื่อมต่อ API ต่อเนื่อง</p>
              </div>
              <div className="bg-gray-100 p-3 flex justify-end gap-2 border-t border-gray-200">
                <div className="bg-gray-300 text-gray-500 px-4 py-1.5 rounded text-xs font-bold cursor-not-allowed">ไม่อนุญาต</div>
                <div className="bg-[#00B900] text-white px-4 py-1.5 rounded text-xs font-bold shadow-sm">ตกลง</div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-[#00B900] mb-2">STEP 3</h3>
            <p className="text-center text-gray-600 font-medium">เชื่อมต่อข้อมูลเพจของคุณแบบถาวร<br/>(เข้ารหัสความปลอดภัยระดับสูง)</p>
          </div>

        </div>

        {/* Call to Action */}
        <div className="max-w-md mx-auto relative animate-fade-in-up" style={{animationDelay: '300ms'}}>
          <button 
            onClick={handleRegister}
            className="w-full bg-[#00B900] hover:bg-[#00a000] text-white text-xl font-bold py-5 px-8 rounded-2xl shadow-xl shadow-[#00B900]/25 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 relative overflow-hidden group"
          >
            <div className="absolute inset-0 w-1/4 h-full bg-white/20 -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1s_ease-in-out_forwards]"></div>
            <MessageCircle size={28} fill="currentColor" /> สมัครใช้งานผ่าน LINE
          </button>
        </div>

      </div>

      {/* Footer Security Note */}
      <div className="bg-gray-50 py-10 text-center border-t border-gray-200 mt-auto">
        <div className="max-w-2xl mx-auto px-4">
          <ShieldCheck size={32} className="mx-auto text-gray-400 mb-3" />
          <h4 className="text-lg font-bold text-gray-700 mb-2 mt-4">ข้อมูลปลอดภัย ด้วยระบบเข้ารหัสมาตรฐานเดียวกับธนาคาร</h4>
          <p className="text-gray-500 relative inline-block">
            ข้อมูลทุกอย่างจะไม่ถูกเปิดเผยหรือเปลี่ยนแปลง ก่อนได้รับอนุญาตจากผู้ใช้
          </p>
        </div>
      </div>
      
    </div>
  );
}
