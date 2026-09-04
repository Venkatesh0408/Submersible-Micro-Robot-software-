import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Info, Users, ShieldAlert } from 'lucide-react';

export default function Welcome() {
    const navigate = useNavigate();

    return (
        <div className="fixed inset-0 bg-transparent overflow-hidden flex flex-col items-center justify-center z-40">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="relative z-10 w-full max-w-4xl p-8 md:p-12 bg-gradient-to-br from-[#16203a] to-[#070b14] backdrop-blur-2xl border border-cyan-500/30 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col items-center"
            >
                <motion.h1 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="text-4xl md:text-6xl font-black text-white tracking-widest uppercase mb-4 text-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                    style={{ fontFamily: '"Orbitron", sans-serif' }}
                >
                    Welcome Captain
                </motion.h1>
                
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="text-cyan-300 text-lg md:text-xl font-bold tracking-wider mb-12 text-center max-w-lg drop-shadow-md"
                >
                    Ready to begin your underwater inspection mission?
                </motion.p>

                <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl justify-center">
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 0.5 }}
                        onClick={() => navigate('/home')}
                        className="group relative flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-600 to-cyan-800 text-white shadow-[0_0_20px_rgba(18,211,224,0.4)] hover:shadow-[0_0_30px_rgba(18,211,224,0.6)] px-8 py-5 rounded-2xl font-black uppercase tracking-widest overflow-hidden transition-all duration-300 shadow-[0_10px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.2)] hover:-translate-y-1"
                    >
                        <div className="absolute inset-0 bg-cyan-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                        <span className="relative z-10">Enter Mission</span>
                        <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                </div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6, duration: 0.8 }}
                    className="flex flex-wrap justify-center gap-4 mt-12 w-full"
                >
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#163048] hover:bg-cyan-900/40 border border-cyan-500/30 text-white text-sm font-bold tracking-wide transition-colors drop-shadow-md backdrop-blur-md"
                    >
                        <Info className="w-4 h-4 text-cyan-400" /> System Information
                    </button>
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#163048] hover:bg-cyan-900/40 border border-cyan-500/30 text-white text-sm font-bold tracking-wide transition-colors drop-shadow-md backdrop-blur-md"
                    >
                        <ShieldAlert className="w-4 h-4 text-cyan-400" /> About Project
                    </button>
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#163048] hover:bg-cyan-900/40 border border-cyan-500/30 text-white text-sm font-bold tracking-wide transition-colors drop-shadow-md backdrop-blur-md"
                    >
                        <Users className="w-4 h-4 text-cyan-400" /> Team
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
}
