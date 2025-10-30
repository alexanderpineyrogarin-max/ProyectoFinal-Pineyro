// ui.js — micro librería de UI (modales y toasts) para reemplazar alert/prompt/confirm
const Ui = (() => {
  const modal = document.getElementById('modal');
  const mTitle = document.getElementById('modalTitle');
  const mBody = document.getElementById('modalBody');
  const btnOk = document.getElementById('modalOk');
  const btnCancel = document.getElementById('modalCancel');

  function modalConfirm({ title = 'Confirmar', html = '', okText = 'Aceptar', cancelText = 'Cancelar' }) {
    return new Promise((resolve) => {
      mTitle.textContent = title;
      mBody.innerHTML = html;
      btnOk.textContent = okText;
      btnCancel.textContent = cancelText;
      modal.classList.remove('hidden');

      function cleanup(result){
        modal.classList.add('hidden');
        btnOk.removeEventListener('click', onOk);
        btnCancel.removeEventListener('click', onCancel);
        resolve(result);
      }
      function onOk(){ cleanup(true); }
      function onCancel(){ cleanup(false); }

      btnOk.addEventListener('click', onOk);
      btnCancel.addEventListener('click', onCancel);
    });
  }

  function toast(message, ms = 2500){
    const el = document.createElement('div');
    el.textContent = message;
    el.style.position = 'fixed';
    el.style.left = '50%';
    el.style.bottom = '20px';
    el.style.transform = 'translateX(-50%)';
    el.style.background = '#0e1632';
    el.style.border = '1px solid #223058';
    el.style.boxShadow = '0 10px 20px rgba(0,0,0,.35)';
    el.style.color = '#eaf0ff';
    el.style.padding = '10px 14px';
    el.style.borderRadius = '12px';
    el.style.zIndex = '9999';
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), ms);
  }

  return { modalConfirm, toast };
})();
