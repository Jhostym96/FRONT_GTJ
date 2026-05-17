const Footer = () => {
  return (
    <footer className="app-footer sticky bottom-0 z-10 mt-auto py-4">
      <div className="w-full flex justify-center">
        <div className="text-sm text-center">
          © {new Date().getFullYear()}{" "}
          <span className="text-main font-semibold">TRANSPORTES J EIRL</span>.{" "}
          Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
