const Footer = ({ collapsed }) => {
  return (
    <footer
      className={`app-footer mt-auto py-3 text-xs sm:text-sm ${
        collapsed ? "md:ml-20" : "md:ml-64"
      }`}
    >
      <div className="flex w-full justify-center px-4">
        <div className="text-center">
          © {new Date().getFullYear()}{" "}
          <span className="text-main font-semibold">TRANSPORTES J EIRL</span>.{" "}
          Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
