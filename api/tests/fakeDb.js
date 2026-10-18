// Tiny in-memory stand-in for Firestore so tests run with no internet or keys.
function makeFakeDb(seed = {}) {
  const store = {};
  for (const [name, docs] of Object.entries(seed)) store[name] = { ...docs };
  let counter = 0;
  const col = (name) => (store[name] = store[name] || {});
  const snapDoc = (id, data) => ({ id, exists: data !== undefined, data: () => data });

  return {
    collection(name) {
      return {
        async get() {
          return { docs: Object.entries(col(name)).map(([id, d]) => snapDoc(id, d)) };
        },
        where(field, op, value) {
          return {
            async get() {
              return {
                docs: Object.entries(col(name))
                  .filter(([, d]) => d[field] === value)
                  .map(([id, d]) => snapDoc(id, d)),
              };
            },
          };
        },
        async add(data) {
          const id = `doc${++counter}`;
          col(name)[id] = { ...data };
          return { id };
        },
        doc(id) {
          return {
            async get() { return snapDoc(id, col(name)[id]); },
            async update(u) { col(name)[id] = { ...col(name)[id], ...u }; },
            async delete() { delete col(name)[id]; },
          };
        },
      };
    },
  };
}
module.exports = makeFakeDb;
