// Referencias al diálogo de edición y al espacio donde se presentan errores.
const descriptionDialog = document.getElementById('description-dialog');
const descriptionForm = document.getElementById('description-form');
const descriptionError = document.getElementById('description-error');

// Inicializa el formulario con los datos asociados al botón de cada proyecto.
document.querySelectorAll('.edit-description').forEach((button) => {
  button.addEventListener('click', () => {
    descriptionForm.elements.project_id.value = button.dataset.projectId;
    descriptionForm.elements.name.value = button.dataset.name;
    descriptionForm.elements.client_name.value = button.dataset.client;
    descriptionForm.elements.address.value = button.dataset.address;
    descriptionForm.elements.designer.value = button.dataset.designer;
    descriptionError.hidden = true;
    descriptionError.textContent = '';
    descriptionDialog.showModal();
  });
});

// Cierra el diálogo sin enviar cambios.
document.getElementById('cancel-description').addEventListener('click', () => {
  descriptionDialog.close();
});

// Envía la actualización al endpoint PHP y comunica el resultado al usuario.
descriptionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = descriptionForm.querySelector('[type="submit"]');
  const formData = new FormData(descriptionForm);
  formData.append('action', 'update_description');
  submitButton.disabled = true;
  descriptionError.hidden = true;

  try {
    const response = await fetch('save_project.php', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'No se pudo guardar la descripción.');
    }
    window.location.reload();
  } catch (error) {
    descriptionError.textContent = error.message;
    descriptionError.hidden = false;
  } finally {
    submitButton.disabled = false;
  }
});
