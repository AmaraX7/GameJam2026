# MASK SHIFT - Ultimate Edition

Un juego de plataformas 2D donde las máscaras te otorgan poderes únicos para superar desafíos cada vez más complejos.

## Controles

### Teclado
- **← →** o **A D**: Mover
- **↑** o **W** o **ESPACIO**: Saltar
- **SHIFT**: Dash (impulso rápido)
- **1-8**: Cambiar de máscara
- **E**: Activar habilidad especial (Máscara de Tiempo)
- **ESC**: Pausa

### Táctil (móvil)
- Botones en pantalla para movimiento, salto y dash
- Botones de máscaras en la parte inferior

## Las Máscaras y sus Poderes

### Sin Máscara
- Tu verdadero rostro
- Sin habilidades especiales

### Espíritu (Cyan)
- **Habilidad**: Atravesar bloques espectrales (cyan)
- Útil para acceder a áreas ocultas

### Llama (Rojo)
- **Habilidades**: 
  - Derretir bloques de hielo
  - Iluminar zonas oscuras
- Esencial en niveles con hielo y oscuridad

### Sombra (Morado oscuro)
- **Habilidades**:
  - Escalar paredes especiales
  - Volverse invisible ante centinelas
- Perfecta para sigilo y exploración vertical

### Tiempo (Morado)
- **Habilidad**: Ralentizar el mundo (presiona E)
  - Enemigos se mueven más lento
  - Plataformas móviles se ralentizan
- Estratégica para secciones difíciles

### Naturaleza (Verde)
- **Habilidad**: Crear plataformas al acercarte a puntos de crecimiento
- Las plataformas emergen automáticamente

### Agua (Azul)
- **Habilidad**: Nadar libremente en zonas de agua
- Sin esta máscara, el agua te mata

### Tormenta (Morado claro)
- **Habilidad**: Control mejorado en zonas de viento
- Surfea corrientes de aire con mayor efectividad

## Mecánicas del Juego

### Elementos del Nivel

#### Bloques
- **Grises**: Plataformas sólidas normales
- **Cyan**: Solo atravesables con Máscara Espíritu
- **Azul claro**: Hielo - derretible con Máscara Llama
- **Morado oscuro**: Paredes escalables con Máscara Sombra
- **Morado claro**: Cristales decorativos
- **Nubes blancas**: Plataformas de un solo sentido (atravesables desde abajo)

#### Objetos Coleccionables
- **Orbes dorados**: Aumentan tu puntuación
- **Máscaras**: Nuevas habilidades permanentes
- **Secretos**: Áreas ocultas con recompensas especiales
- **Checkpoints**: Puntos de reaparición (no disponibles en Modo Desafío)

#### Power-ups Temporales
- **Escudo**: Protección contra daño
- **Velocidad**: Movimiento más rápido
- **Doble Salto**: Salto adicional en el aire

#### Peligros
- **Enemigos**:
  - Patrulladores básicos
  - Centinelas (te detectan visualmente)
  - Peces (en zonas de agua)
  - Voladores
  - Enemigos rápidos
- **Trampas**: Muerte instantánea
- **Agua**: Mortal sin Máscara de Agua
- **Viento**: Te empuja en direcciones específicas

#### Elementos Especiales
- **Portales**: Teletransportación instantánea
- **Plataformas móviles**: Se mueven entre dos puntos
- **Puntos de crecimiento**: Crean plataformas con Máscara Naturaleza
- **Zonas oscuras**: Requieren Máscara Llama para iluminar

### Sistema de Combos
- Recoger objetos y completar acciones sin morir aumenta tu multiplicador
- x10 combo desbloquea el logro "Combo Maestro"
- Mayor multiplicador = más puntuación

### Sistema de Ranking
Al completar un nivel recibes un rango basado en:
- **Tiempo**: Comparado con el par time (tiempo objetivo)
- **Muertes**: Menos es mejor
- **Orbes**: Coleccionar todos da bonificación
- **Rangos**: S (mejor), A, B, C, D

### Dash
- **Cooldown**: 45 frames (~0.75 segundos)
- **Duración**: 10 frames
- Te impulsa rápidamente en la dirección que miras
- Deja rastro de partículas
- Úsalo para atacar al jefe final

## Modos de Juego

### Modo Normal
- 11 niveles progresivos
- Checkpoints disponibles
- Desbloquea máscaras gradualmente
- Historia completa

### Modo Desafío
- Sin checkpoints
- Mueres = reinicio desde el inicio del nivel
- Solo para jugadores experimentados
- Desbloquea al completar el juego

## Logros

- **Primera Máscara**: Recoge tu primera máscara
- **Coleccionista**: Recoge todas las máscaras
- **Demonio Veloz**: Completa un nivel en menos de 30 segundos
- **Inmortal**: Completa un nivel sin morir
- **Combo Maestro**: Alcanza combo x10
- **Dasher**: Realiza 50 dashes
- **Cazador**: Derrota al jefe final
- **Perfeccionista**: Obtén rango S en un nivel
- **Explorador**: Encuentra un área secreta
- **Final Verdadero**: Descubre el nivel secreto del Vacío

## Niveles

1. **El Despertar** - Tutorial básico
2. **Templo Espíritu** - Introducción a la Máscara Espíritu
3. **Forja Ardiente** - Máscara Llama y enemigos
4. **Abismo Sombrío** - Sigilo con Máscara Sombra
5. **Cavernas Cristal** - Portales y reflejos
6. **Océano Profundo** - Natación con Máscara Agua
7. **Cielos Etéreos** - Viento y Máscara Tormenta
8. **Jardín del Tiempo** - Control temporal
9. **Bosque Primordial** - Crecimiento con Máscara Naturaleza
10. **Santuario Final** - Jefe final: El Guardián
11. **El Vacío** - Nivel secreto (requiere encontrar entrada oculta)

## Audio

El juego genera sonidos procedurales usando Web Audio API:
- Saltos, dashes, colecciones
- Efectos de máscara
- Hits al jefe
- Logros

## Consejos

1. **Experimenta con máscaras**: Cada nivel tiene una máscara óptima
2. **Busca secretos**: Áreas ocultas dan puntos extra
3. **Domina el dash**: Esencial para combate y movilidad
4. **Combo chains**: Mantén el combo para más puntos
5. **Par times**: Intenta vencer el tiempo objetivo
6. **Explora**: Hay un nivel secreto...

## Tecnología

- React + Hooks
- Web Audio API (sonidos procedurales)
- Tailwind CSS
- Canvas/DOM híbrido para renderizado
- Sistema de física custom

## Historia

En un mundo donde las máscaras definen quién eres, has perdido la tuya. Viaja a través de reinos olvidados para descubrir quién eras realmente. ¿Necesitas las máscaras... o el coraje de mostrar tu verdadero rostro?

---

**¡Buena suerte, viajero!**