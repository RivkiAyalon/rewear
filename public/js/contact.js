// מטפל בשליחת טופס יצירת הקשר לשרת.
document.getElementById('contact-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  // אוספים את הנתונים שהמשתמשת מילאה בטופס.
  const formData = new FormData(event.target);

  const data = {
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    body: formData.get('body')
  };

  try {
    // שולחים את ההודעה לשרת דרך ה-API.
    await api('/api/messages', {
  method: 'POST',
  body: JSON.stringify(data)
});

    event.target.reset();

    // מציגים למשתמשת הודעה שהטופס נשלח בהצלחה.
    if (typeof showToast === 'function') {
      showToast('Message sent successfully', 'success');    }
  } catch (err) {
    console.error(err);

    // מציגים למשתמשת הודעת שגיאה אם השליחה נכשלה.
    if (typeof showToast === 'function') {
      showToast('Failed to send message', 'error');    }
  }
});