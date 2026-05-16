const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-4 border-t border-gray-800 mt-auto sticky bottom-0 z-10">
      <div className="w-full flex justify-center">
        <div className="text-sm text-center">
          © {new Date().getFullYear()}{" "}
          <span className="text-white font-semibold">TRANSPORTES J EIRL</span>.{" "}
          Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
