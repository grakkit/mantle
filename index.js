const tasks = [];
const crypto = new java.security.SecureRandom();
const framework = {
   access: (object) => {
      if (object === null || typeof object !== 'object') {
         return object;
      } else {
         const output = { _: object };
         Object.entries(object).forEach((entry) => {
            if (toString.apply(entry[1]) === '[foreign HostFunction]') {
               Object.defineProperty(output, entry[0], {
                  get () {
                     const output = (...args) => framework.access(entry[1](...args));
                     output.hostFunction = entry[0];
                     return output;
                  }
               });
            } else {
               Object.defineProperty(output, entry[0], {
                  get () {
                     return framework.access(entry[1]);
                  }
               });
            }
            let index = undefined;
            entry[0].startsWith('is') && entry[0][2] && (index = 2);
            entry[0].startsWith('get') && entry[0][3] && (index = 3);
            if (index) {
               let key = entry[0].slice(index);
               if (key.length) {
                  let camel = key[0].toLowerCase() + key.slice(1);
                  if (!Object.keys(object).includes(camel)) {
                     try {
                        entry[1]();
                        Object.defineProperty(output, camel, {
                           get () {
                              return framework.access(entry[1]());
                           },
                           set (value) {
                              return object[`set${key}`] && object[`set${key}`](value);
                           }
                        });
                     } catch (error) {}
                  }
               }
            }
         });
         const array = framework.array(object);
         Object.keys(array).forEach((index) => {
            if (!Object.keys(output).includes(index)) {
               Object.defineProperty(output, index, {
                  get () {
                     return framework.access(array[index]);
                  }
               });
            }
         });
         return output;
      }
   },
   array: (object) => {
      const output = [];
      if (typeof object.length === 'number') {
         if (object.length > 0) {
            let index = 0;
            while (output.length < object.length) {
               output.push(object[index++]);
            }
         }
      } else if (typeof object.forEach === 'function') {
         object.forEach((entry) => {
            output.push(entry);
         });
      } else if (typeof object.forEachRemaining === 'function') {
         object.forEachRemaining((entry) => {
            output.push(entry);
         });
      }
      return output;
   },
   base: {
      characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
      encode: (string) => {
         let index = 0;
         let result = '';
         while (index < string.length) {
            let a = string.charCodeAt(index++) || 0;
            let b = string.charCodeAt(index++) || 0;
            let c = string.charCodeAt(index++) || 0;
            let d = ((b & 0xf) << 2) | ((c >> 6) & 0x3);
            let e = c & 0x3f;
            b ? c || (e = 64) : (d = e = 64);
            result += framework.base.characters.charAt((a >> 2) & 0x3f);
            result += framework.base.characters.charAt(((a & 0x3) << 4) | ((b >> 4) & 0xf));
            result += framework.base.characters.charAt(d);
            result += framework.base.characters.charAt(e);
         }
         return result;
      },
      decode: (string) => {
         let index = 0;
         let result = '';
         while (index < string.length) {
            let a = framework.base.characters.indexOf(string.charAt(index++));
            let b = framework.base.characters.indexOf(string.charAt(index++));
            let c = framework.base.characters.indexOf(string.charAt(index++));
            let d = framework.base.characters.indexOf(string.charAt(index++));
            let e = ((b & 0xf) << 4) | ((c >> 2) & 0xf);
            let f = ((c & 0x3) << 6) | (d & 0x3f);
            result += String.fromCharCode(((a & 0x3f) << 2) | ((b >> 4) & 0x3));
            result += e ? String.fromCharCode(e) : '';
            result += f ? String.fromCharCode(f) : '';
         }
         return result;
      }
   },
   camel: (string, separator) => {
      const pascal = framework.pascal(string, separator);
      return framework.lower(pascal[0]) + pascal.slice(1);
   },
   clamp: (number, min, max) => {
      return number < min ? min : number > max ? max : number;
   },
   collect: (...array) => {
      const output = new java.util.ArrayList();
      array.forEach((entry) => {
         output.add(entry);
      });
      return output;
   },
   color: (string) => {
      return string.replace(/(&)/g, '§').replace(/(§§)/g, '&');
   },
   define: (object, consumer) => {
      consumer ||
         (consumer = (entry) => {
            return {
               get: () => {
                  return entry.value;
               },
               set: (value) => {
                  entry.value = value;
               }
            };
         });
      const output = {};
      framework.entries(object).forEach((entry) => {
         const info = consumer(entry);
         if (info) {
            Object.defineProperty(output, entry.key, {
               get () {
                  if (info.get) {
                     return info.get();
                  }
               },
               set (value) {
                  if (info.set) {
                     info.set(value);
                  }
               }
            });
         }
      });
      return output;
   },
   dist: (source, target, flat) => {
      if (source.getWorld() !== target.getWorld()) return Infinity;
      var deltaX = source.getX() - target.getX();
      var deltaY = flat ? 0 : source.getY() - target.getY();
      var deltaZ = source.getZ() - target.getZ();
      return Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
   },
   entries: (object) => {
      return framework.keys(object).map((key) => {
         return { key: key, value: object[key] };
      });
   },
   extend: (object, ...objects) => {
      return Object.assign(object, ...objects);
   },
   flat: (array) => {
      return array.filter((entry) => {
         return entry;
      });
   },
   interval: (script, period) => {
      const state = { iteration: null };
      const loop = () => {
         try {
            script();
         } catch (error) {
            console.error(error);
         }
         state.iteration = framework.timeout(loop, period);
      };
      state.iteration = framework.timeout(loop, period);
      const output = { cancel: () => state.iteration.cancel() };
      tasks.push(output);
      return output;
   },
   key: (object, value) => {
      return framework.keys(object)[framework.values(object).indexOf(value)];
   },
   keys: (object) => {
      return Object.keys(object);
   },
   lower: (string) => {
      return string.toLowerCase();
   },
   match: (object, filter) => {
      switch (typeof filter) {
         case 'undefined':
            return true;
         case 'function':
            return filter(object);
         case 'object':
            switch (framework.type(filter)) {
               case 'Array':
                  return filter
                     .map((entry) => {
                        return framework.match(object, entry);
                     })
                     .includes(true);
               case 'Object':
                  return !framework
                     .keys(filter)
                     .map((key) => {
                        return framework.match(object[key], filter[key]);
                     })
                     .includes(false);
               default:
                  return object === filter;
            }
         default:
            return object === filter;
      }
   },
   mirror: (options) => {
      options || (options = {});
      const mirror = framework.extend(options.array || [], {
         add: options.add || (() => {}),
         remove: options.remove || (() => {}),
         clear: options.clear || (() => {})
      });
      return {
         get: () => {
            return mirror;
         },
         set: (value) => {
            mirror.clear();
            value.forEach(mirror.add);
         }
      };
   },
   object: (array, consumer) => {
      consumer ||
         (consumer = (entry, index) => {
            return { [entry.key || index]: entry.value || entry };
         });
      return framework.extend({}, ...framework.flat(array.map(consumer)));
   },
   pascal: (string, separator) => {
      if (separator) {
         return string
            .split(separator)
            .map((chunk) => {
               return framework.pascal(chunk);
            })
            .join('');
      } else {
         return framework.upper(string[0]) + string.slice(1);
      }
   },
   player: (target) => {
      let uuid = undefined;
      const players = Object.assign({}, core.data('grakkit/players'));
      if (target instanceof java.util.UUID) {
         uuid = target;
      } else if (typeof target === 'string') {
         const online = server.getPlayer(target);
         if (players[target]) {
            uuid = java.util.UUID.fromString(players[target].uuid);
         } else if (online) {
            uuid = online.getUniqueId();
         } else {
            framework.array(server.getOfflinePlayers()).forEach((offline) => {
               const stored = offline.getUniqueId();
               if (uuid === undefined && [ stored.toString(), offline.getName() ].includes(target)) uuid = stored;
            });
            if (uuid === undefined) {
               try {
                  uuid = java.util.UUID.fromString(target);
               } catch (error) {
                  uuid = server.getOfflinePlayer(target).getUniqueId();
               }
            }
         }
      } else if (typeof target.uuid === 'string') {
         uuid = java.util.UUID.fromString(target.uuid);
      } else if (typeof target.uuid === 'function') {
         uuid = java.util.UUID.fromString(target.uuid());
      } else if (typeof target.getUniqueId === 'function') {
         uuid = target.getUniqueId();
      } else if (target.constructor === Array) {
         return target.map(framework.player);
      } else {
         throw `FrameworkError: Cannot convert ${core.output(target)} to standardized player notation!`;
      }
      return Object.assign(players[uuid.toString()] || { uuid: uuid.toString() }, {
         online: server.getPlayer(uuid),
         offline: server.getOfflinePlayer(uuid)
      });
   },
   rand: (...args) => {
      switch (args.length) {
         case 0:
            return (crypto.nextInt() + 2147483648) / 4294967296;
         case 1:
            if (typeof args[0] === 'number') return _.rand() < args[0];
            else if (args[0].length) return args[0][framework.rand(0, args[0].length - 1)];
            else return framework.rand(framework.keys(args[0]));
         case 2:
            return Math.floor(_.rand() * (args[1] - args[0] + 1)) + args[0];
      }
   },
   raw: (string) => {
      return string.replace(/(&)/g, '&&').replace(/(§)/g, '&');
   },
   simplify: (...context) => {
      let output = null;
      const object = context[0];
      switch (framework.type(object)) {
         case 'Array':
            output = [];
            for (let entry of object) {
               if (!context.includes(entry)) {
                  output.push(framework.simplify(entry, ...context));
               }
            }
            output = framework.flat(output);
            output.length || (output = null);
            break;
         case 'Object':
            output = {};
            for (let key of framework.keys(object)) {
               if (!context.includes(object[key])) {
                  output[key] = framework.simplify(object[key], ...context);
               }
            }
            output = framework.strain(output);
            framework.keys(output).length || (output = null);
            break;
         default:
            output = object;
      }
      return output;
   },
   splice: (string, separator, ...index) => {
      return string.split(separator).slice(...index).join(separator);
   },
   strain: (object, consumer) => {
      consumer ||
         (consumer = (entry) => {
            return entry.value;
         });
      return framework.object(framework.entries(object).filter(consumer));
   },
   timeout: (script, period) => {
      const state = { cancel: false };
      const runnable = new (Java.extend(Java.type('java.lang.Runnable')))({ run: () => state.cancel || script() });
      server.getScheduler().runTaskLater(core.plugin, runnable, Math.ceil(period / 50));
      const output = { cancel: () => (state.cancel = true) };
      tasks.push(output);
      return output;
   },
   type: (object) => {
      const type = toString.apply(object).split(' ')[1].slice(0, -1);
      return type === 'Object' ? object.constructor.name : type;
   },
   upper: (string) => {
      return string.toUpperCase();
   },
   uuid: (string) => {
      return string ? java.util.UUID.fromString(string) : java.util.UUID.randomUUID();
   },
   values: (object) => {
      return Object.values(object);
   }
};

core.event('org.bukkit.event.player.PlayerJoinEvent', (event) => {
   const player = event.getPlayer();
   const address = player.getAddress().getAddress().getHostAddress();
   const name = player.getName();
   const uuid = player.getUniqueId().toString();
   const info = { address: address, name: name, uuid: uuid };
   Object.assign(core.data('grakkit/players'), {
      [address]: info,
      [name]: info,
      [uuid]: info
   });
});

core.event('org.bukkit.event.server.PluginDisableEvent', (event) => {
   event.getPlugin() === core.plugin && tasks.forEach((task) => task.cancel());
});

core.export(framework);
