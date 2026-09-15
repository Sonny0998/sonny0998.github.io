#!/bin/bash
# Corre esto DENTRO de la carpeta SitesPro con: bash setup.sh
echo "Verificando estructura de SitesPro..."
echo ""

check(){
  if [ -f "$1" ]; then
    echo "✅ $1"
  else
    echo "❌ FALTA: $1"
  fi
}

check "index.html"
check "projects.json"
check "setup.sh"
check "css/styles.css"
check "js/script.js"
check "assets/favicon.svg"
check "admin/index.html"

echo ""
echo "Si ves algún ❌, mueve ese archivo a la carpeta indicada."
echo "Si todo dice ✅, abre index.html con Live Server y listo."
