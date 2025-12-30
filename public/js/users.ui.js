export const renderUsers = (users) => {
  const tbody = document.getElementById("usersTable");
  tbody.innerHTML = "";

  users.forEach(user => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${user.username}</td>
      <td>${user.role}</td>
      <td>
        <button onclick='openEditUser(${JSON.stringify(user)})'>Edit</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
};
