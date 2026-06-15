import sys
from PIL import Image

def remove_background(image_path, output_path):
    # Abrir imagen en modo RGBA
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    # Matriz para marcar pixels de fondo visitados
    visited = [[False for _ in range(height)] for _ in range(width)]
    
    # Puntos de inicio para la inundación (las esquinas y bordes)
    queue = []
    
    # Agregar los bordes a la cola de procesamiento
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
        visited[x][0] = True
        visited[x][height - 1] = True
        
    for y in range(1, height - 1):
        queue.append((0, y))
        queue.append((width - 1, y))
        visited[0][y] = True
        visited[width - 1][y] = True
        
    # Tolerancia para color blanco (255, 255, 255)
    # Si la diferencia de color es menor a esta distancia, se considera fondo
    tolerance = 40.0
    
    background_pixels = set()
    
    # BFS para inundación
    while queue:
        cx, cy = queue.pop(0)
        r, g, b, a = pixels[cx, cy]
        
        # Calcular distancia euclidiana al blanco puro (255, 255, 255)
        dist_to_white = ((255 - r)**2 + (255 - g)**2 + (255 - b)**2) ** 0.5
        
        # También podemos ver si es un gris muy claro (para sombras bajo los pies)
        # La sombra debajo de los pies suele tener colores oscuros o grises.
        # Queremos borrar también la sombra gris muy clara o difusa del fondo.
        # Si dist_to_white es menor a la tolerancia, es fondo.
        # O si es parte de la sombra suave (por ejemplo, x es muy bajo o alto y está en la parte inferior)
        is_bg = dist_to_white < tolerance
        
        # Especial para la sombra en el piso: si está en la parte inferior, y es un gris claro
        # (por ejemplo, R, G, B están todos sobre 200 y la diferencia entre ellos es muy baja)
        if cy > height * 0.8 and r > 180 and g > 180 and b > 180:
            # R, G, B muy cercanos entre sí (gris)
            if abs(r - g) < 10 and abs(g - b) < 10:
                is_bg = True
        
        if is_bg:
            background_pixels.add((cx, cy))
            
            # Revisar vecinos (4-conectividad)
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if not visited[nx][ny]:
                        visited[nx][ny] = True
                        queue.append((nx, ny))

    # Segundo paso: Crear la imagen de salida aplicando transparencia y suavizado de bordes
    for x in range(width):
        for y in range(height):
            if (x, y) in background_pixels:
                pixels[x, y] = (0, 0, 0, 0)
            else:
                # Comprobar si es un píxel de borde para suavizarlo (antialiasing)
                # Si tiene algún vecino en background_pixels, le reducimos el alpha para suavizar
                is_border = False
                neighbor_bg_count = 0
                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < width and 0 <= ny < height:
                        if (nx, ny) in background_pixels:
                            is_border = True
                            neighbor_bg_count += 1
                
                if is_border:
                    r, g, b, a = pixels[x, y]
                    # Reducir el canal alpha basándose en cuántos vecinos son de fondo
                    alpha_factor = 1.0 - (neighbor_bg_count / 8.0) * 0.7
                    new_a = int(a * alpha_factor)
                    
                    # También mezclamos ligeramente el color hacia negro para evitar el reborde blanco
                    # (remoción de halo blanco / defringe)
                    new_r = int(r * alpha_factor)
                    new_g = int(g * alpha_factor)
                    new_b = int(b * alpha_factor)
                    pixels[x, y] = (r, g, b, new_a)

    # Guardar imagen procesada
    img.save(output_path, "PNG")
    print(f"Imagen procesada y guardada en {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python process_images.py <img_entrada> <img_salida>")
        sys.exit(1)
        
    remove_background(sys.argv[1], sys.argv[2])
