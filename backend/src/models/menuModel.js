const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../../data/menu.json');

// Initialize if not exists
if (!fs.existsSync(path.dirname(dataFilePath))) {
  fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
}
if (!fs.existsSync(dataFilePath)) {
  fs.writeFileSync(dataFilePath, JSON.stringify([]));
}

const getMenu = () => {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

const saveMenu = (menu) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(menu, null, 2));
};

exports.getAll = () => {
  return getMenu();
};

exports.getById = (id) => {
  const menu = getMenu();
  return menu.find(item => item.id === parseInt(id));
};

exports.create = (itemData) => {
  const menu = getMenu();
  const newItem = {
    id: Date.now(), // simple id generator
    ...itemData,
    created_at: new Date().toISOString()
  };
  menu.push(newItem);
  saveMenu(menu);
  return newItem;
};

exports.update = (id, itemData) => {
  const menu = getMenu();
  const index = menu.findIndex(item => item.id === parseInt(id));
  if (index === -1) return null;
  
  menu[index] = { ...menu[index], ...itemData };
  saveMenu(menu);
  return menu[index];
};

exports.delete = (id) => {
  const menu = getMenu();
  const index = menu.findIndex(item => item.id === parseInt(id));
  if (index === -1) return false;
  
  menu.splice(index, 1);
  saveMenu(menu);
  return true;
};
