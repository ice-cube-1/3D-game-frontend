export function parseOBJ(text) {
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];
  const objColors = [[0, 0, 0]];

  const objVertexData = [
      objPositions,
      objTexcoords,
      objNormals,
      objColors,
  ];
   
  const positions = [];
  const texcoords = [];
  const normals = [];
  const colors = [];
  const indices = [];

  let geometry;
  let groups = ['default'];
  let material = 'default';
  let object = 'default';

  const noop = () => {};

  function setGeometry() {
      if (geometry) {
          // Process accumulated geometry data
      }
      geometry = {
          object,
          groups,
          material,
          data: {
              position: positions,
              texcoord: texcoords,
              normal: normals,
              color: colors,
          },
      };
  }

  function addVertex(vert) {
      const ptn = vert.split('/');
      ptn.forEach((objIndexStr, i) => {
          if (!objIndexStr) return;
          const objIndex = parseInt(objIndexStr, 10);
          const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
          const vertexData = objVertexData[i][index];
          if (i === 0) positions.push(...vertexData);
          if (i === 1) texcoords.push(...vertexData);
          if (i === 2) normals.push(...vertexData);
          if (i === 3) colors.push(...vertexData);
      });
  }

  const keywords = {
      v(parts) {
          if (parts.length > 3) {
              objPositions.push(parts.slice(0, 3).map(parseFloat));
              objColors.push(parts.slice(3).map(parseFloat));
          } else {
              objPositions.push(parts.map(parseFloat));
          }
      },
      vn(parts) {
          objNormals.push(parts.map(parseFloat));
      },
      vt(parts) {
          objTexcoords.push(parts.map(parseFloat));
      },
      f(parts) {
          setGeometry();
          const numTriangles = parts.length - 2;
          for (let tri = 0; tri < numTriangles; ++tri) {
              addVertex(parts[0]);
              addVertex(parts[tri + 1]);
              addVertex(parts[tri + 2]);
          }
      },
      s: noop,
      mtllib(parts, unparsedArgs) {
          // Handle material library
      },
      usemtl(parts, unparsedArgs) {
          material = unparsedArgs;
          setGeometry();
      },
      g(parts) {
          groups = parts;
          setGeometry();
      },
      o(parts, unparsedArgs) {
          object = unparsedArgs;
          setGeometry();
      },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
      const line = lines[lineNo].trim();
      if (line === '' || line.startsWith('#')) continue;
      const m = keywordRE.exec(line);
      if (!m) continue;
      const [, keyword, unparsedArgs] = m;
      const parts = line.split(/\s+/).slice(1);
      const handler = keywords[keyword];
      if (!handler) {
          console.warn('unhandled keyword:', keyword);
          continue;
      }
      handler(parts, unparsedArgs);
  }

  return {
      positions,
      texcoords,
      normals,
      colors,
      indices,
  };
}
