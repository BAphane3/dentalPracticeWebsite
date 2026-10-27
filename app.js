const header = document.querySelector('header');

if (header) {
  window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.classList.add('compact');
  } else {
    header.classList.remove('compact');
  }
});
}

const appointmentDate = document.getElementById("appointment-date");
if (appointmentDate) {
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() +1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const todayFormatted = `${year}-${month}-${day}`;
appointmentDate.min = todayFormatted;
}


