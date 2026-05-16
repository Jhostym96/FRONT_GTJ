import { motion } from "framer-motion";
import logo from "/tj.png"; // 👈 ajusta la ruta de tu logo

export default function PageLoader() {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center 
                 bg-white/10 backdrop-blur-md z-[9999]" // overlay translúcido con blur
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.img
        src={logo}
        alt="Logo"
        className="w-28 h-28 object-contain"
        animate={{ 
          rotate: 360, 
          scale: [1, 1.1, 1] // pulso suave
        }}
        transition={{
          rotate: { repeat: Infinity, duration: 1.5, ease: "linear" },
          scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
        }}
      />
    </motion.div>
  );
}
