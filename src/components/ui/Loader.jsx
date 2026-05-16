// src/components/ui/Loader.jsx
function Loader() {
  return (
    <div className="flex justify-center items-center h-40">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-button-primary border-t-transparent"></div>
    </div>
  );
}

export default Loader;
