import { useState, useEffect, useRef } from 'react';
import { Video, MicOff, Users, Heart, Share2, ShoppingCart, Zap, Radio, StopCircle } from 'lucide-react';
import api from '../api';

export default function Live() {
  const [comments, setComments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(0);
  const commentsEndRef = useRef(null);

  const startStream = () => {
    setIsLive(true);
    setViewers(1420);
    fetchLiveStream();
  };

  const endStream = () => {
    setIsLive(false);
    setViewers(0);
  };

  const fetchLiveStream = async () => {
    try {
      const res = await api.get('/live');
      if (res.data.data.comments) setComments(res.data.data.comments);
      if (res.data.data.viewers) setViewers(res.data.data.viewers);
    } catch (error) {
       console.error(error);
    }
  };

  // Auto-scroll comments
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Simulate pushing random comments every 3.5 seconds if isLive
  useEffect(() => {
    let interval;
    if (isLive) {
      interval = setInterval(async () => {
        const faker = [
          { name: 'พิมพ์พรรณ', text: 'อยากให้ลองสีแดงให้ดูหน่อยค่ะ', type: 'normal' },
          { name: 'John Doe', text: 'CF1 2 ชิ้นครับ', type: 'cf' },
          { name: 'กิตติ', text: 'CF2 รหัสอะไรครับ', type: 'normal' },
          { name: 'ซาร่า', text: 'CF2 1', type: 'cf' },
          { name: 'แวววรรณ', text: 'รุ่นใหม่มายังพี่?', type: 'normal' },
          { name: 'ดนัย', text: 'CF3 สีส้มจ้า', type: 'cf' }
        ];
        const randomComment = faker[Math.floor(Math.random() * faker.length)];
        
        setComments(prev => [...prev, { ...randomComment, id: Date.now() }]);

        // If it's a CF, trigger auto-order logic!
        if (randomComment.type === 'cf') {
           try {
             // Create CF Order in Supabase via API
             const res = await api.post('/live/cf-order', {
               customer_name: randomComment.name,
               code: randomComment.text
             });
             const newOrder = res.data.data;
             setOrders(prev => [{
               name: newOrder.customer_name, 
               code: randomComment.text, 
               order_id: newOrder.order_id,
               time: new Date().toLocaleTimeString('th-TH')
             }, ...prev]);
           } catch(err) {
             console.error('Failed to create CF target', err);
           }
        }
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6 pb-4 animate-slide-up">
       
       {/* Left Column: Live Window */}
       <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800 relative">
          
          {/* Header overlay */}
          <div className="absolute top-0 w-full p-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent z-10 flex justify-between items-start text-white">
             <div className="flex items-center gap-2">
                {isLive ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-red-600 rounded-full font-bold text-xs shadow-lg shadow-red-500/30 animate-pulse">
                    <Radio size={14} /> LIVE
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-600/80 rounded-full font-bold text-xs">
                    OFFLINE
                  </div>
                )}
                {isLive && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-black/40 backdrop-blur rounded-full text-sm font-semibold border border-white/10">
                    <Users size={14} className="text-gray-300"/>
                    {(viewers + Math.floor(Math.random() * 10)).toLocaleString()}
                  </div>
                )}
             </div>
             <div className="flex gap-2">
                <button className="p-2 bg-black/40 backdrop-blur rounded-full hover:bg-black/60 transition text-white/90">
                  <MicOff size={18} />
                </button>
                <button className="p-2 bg-black/40 backdrop-blur rounded-full hover:bg-black/60 transition text-white/90">
                  <Share2 size={18} />
                </button>
             </div>
          </div>

          {/* Video Area */}
          <div className="flex-1 bg-gray-950 relative flex items-center justify-center overflow-hidden">
             {!isLive ? (
               <div className="flex flex-col items-center">
                 <button onClick={startStream} className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-white shadow-xl shadow-indigo-500/40 group">
                    <Video size={36} className="group-hover:animate-pulse" />
                 </button>
                 <p className="mt-4 text-gray-400 font-semibold tracking-widest text-sm">START BROADCAST</p>
               </div>
             ) : (
                <div className="absolute inset-0 bg-blue-900/10 flex flex-col items-center justify-center">
                   {/* Fake Camera Preview Effect */}
                   <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/20 to-purple-900/20 mix-blend-overlay" />
                   <div className="w-full h-full border-[10px] border-black/20 absolute pointer-events-none rounded-xl" />
                   
                   <Video size={56} className="opacity-20 mb-4 text-white" />
                   <p className="font-bold text-xl tracking-widest text-white/40 mb-12">CAMERA PREVIEW</p>
                   
                   <button onClick={endStream} className="absolute bottom-6 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-sm transition shadow-lg shadow-red-600/20 flex items-center gap-2 z-20">
                     <StopCircle size={18} /> จบการไลฟ์สด
                   </button>
                </div>
             )}
          </div>

          {/* Bottom Overlay (News Ticker style) */}
          {isLive && (
            <div className="absolute bottom-20 w-full p-4 z-10 flex justify-between items-end pointer-events-none">
              <div className="bg-gradient-to-r from-pink-600 to-rose-500 text-white px-4 py-2 rounded-xl shadow-lg border border-white/20">
                <h2 className="text-sm font-bold flex items-center gap-2"><Zap size={16} className="text-yellow-300" /> โปรโมชั่นลด 50% นาทีทอง!</h2>
              </div>
              <div className="text-pink-500 flex flex-col gap-2 opacity-80">
                <Heart size={32} className="animate-ping" />
                <Heart size={36} className="text-red-500 -ml-2" />
              </div>
            </div>
          )}
       </div>

       {/* Right Column: AI Auto CF Board & Comments */}
       <div className="w-full md:w-96 flex flex-col gap-4 h-full">
         
         {/* CF Board */}
         <div className="glass p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex-shrink-0 animate-fade-in relative overflow-hidden">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-xl" />
           
           <div className="flex justify-between items-center mb-4 relative z-10">
             <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
               <ShoppingCart size={18} className="text-indigo-500"/> AI ดูดรหัส (CF)
             </h3>
             <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
               {orders.length} ยอดใหม่
             </span>
           </div>
           
           <div className="h-40 overflow-y-auto space-y-2 border border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-2.5 relative z-10 hidden-scrollbar">
             {orders.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                 <Zap size={24} className="opacity-30" />
                 <p className="text-xs">AI กำลังรอดูดรหัส CF จากแชท</p>
               </div>
             ) : (
               orders.map((o,i) => (
                 <div key={i} className="text-xs flex flex-col p-2.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-indigo-100 dark:border-indigo-800/30 animate-slide-up">
                   <div className="flex justify-between items-start mb-1">
                     <span className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5"><Users size={12}/>{o.name}</span>
                     <span className="text-[10px] text-gray-400">{o.time}</span>
                   </div>
                   <div className="flex justify-between items-center mt-0.5">
                     <span className="text-gray-600 dark:text-gray-400">สั่ง: <span className="font-mono bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold">{o.code}</span></span>
                     <span className="text-[10px] font-mono text-gray-400">{o.order_id}</span>
                   </div>
                 </div>
               ))
             )}
           </div>
           
           <button className="w-full mt-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 font-semibold rounded-xl text-xs transition duration-200 text-gray-700 dark:text-gray-200 shadow-sm relative z-10 flex items-center justify-center gap-2">
              สรุปยอดและส่งบิล
           </button>
         </div>

         {/* Chat Stream (Bottom) */}
         <div className="glass rounded-2xl flex-1 flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700/60 bg-white/50 dark:bg-gray-800/50 flex justify-between items-center">
               <h3 className="font-bold text-sm text-gray-900 dark:text-white">แชทเรียลไทม์</h3>
               {isLive && <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>}
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#f8fafc] dark:bg-[#0b0d14] hidden-scrollbar">
               {comments.length === 0 && !isLive && (
                 <div className="h-full flex items-center justify-center">
                   <p className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">เริ่มสตรีมเพื่อเห็นคอมเมนต์</p>
                 </div>
               )}
               {comments.map((c) => (
                 <div key={c.id} className="flex flex-col text-sm border-b border-gray-100 dark:border-gray-800/50 pb-2 last:border-0 animate-slide-up">
                    <span className="font-bold text-xs text-gray-500 dark:text-gray-400 mb-0.5">{c.name}</span>
                    <span className={`\${c.type === 'cf' ? 'font-bold font-mono text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 inline-block w-max' : 'text-gray-800 dark:text-gray-200'}`}>
                      {c.text}
                    </span>
                 </div>
               ))}
               <div ref={commentsEndRef} className="h-2"></div>
            </div>
         </div>

       </div>
    </div>
  );
}
