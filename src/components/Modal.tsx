interface ModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

function Modal({ isOpen, message, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-800 p-6 text-center shadow-2xl">
        <h3 className="mb-4 text-xl font-bold text-red-400">Error!</h3>
        <p className="mb-6 text-gray-300">{message}</p>
        <button
          className="rounded-full bg-red-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-red-700"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default Modal;
