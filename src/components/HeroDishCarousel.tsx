import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Skeleton, Typography, useMediaQuery } from "@mui/material";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import type { Dish } from "../types/menu";
import { getHeroDishImage } from "../data/mappers/heroImages";
import styles from "./HeroDishCarousel.module.css";

const IMAGE_SIZES =
  "(max-width: 599px) calc(100vw - 32px), (max-width: 899px) 50vw, (max-width: 1199px) 55vw, 640px";

function shuffled(ids: string[]) {
  const result = [...ids];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function HeroDishCarousel({
  dishes,
  isLoading,
}: {
  dishes?: Dish[];
  isLoading: boolean;
}) {
  const slides = useMemo(
    () =>
      dishes?.filter((dish) =>
        dish.imageUrl?.startsWith("https://res.cloudinary.com/"),
      ) ?? [],
    [dishes],
  );
  const [{ activeId, previousId }, setFrame] = useState<{
    activeId?: string;
    previousId?: string;
  }>({});
  const remaining = useRef<string[]>([]);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const slide = slides.find((dish) => dish.id === activeId) ?? slides[0];
  const previous = slides.find((dish) => dish.id === previousId);

  useEffect(() => {
    // La primera foto ya está visible; las siguientes completan la ronda al azar.
    remaining.current = shuffled(slides.slice(1).map((dish) => dish.id));
  }, [slides]);

  useEffect(() => {
    const updateVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", updateVisibility);
    return () =>
      document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (slides.length < 2 || hovered || focused || !visible || reducedMotion)
      return;
    let cancelled = false;
    let loading = false;
    let pendingId: string | undefined;
    let pendingImage: HTMLImageElement | undefined;
    const current = slides.find((dish) => dish.id === activeId) ?? slides[0];
    const timer = window.setInterval(() => {
      if (loading) return;
      if (remaining.current.length === 0) {
        remaining.current = shuffled(slides.map((dish) => dish.id));
        if (remaining.current[0] === current.id) {
          [remaining.current[0], remaining.current[1]] = [
            remaining.current[1],
            remaining.current[0],
          ];
        }
      }
      pendingId = remaining.current.shift();
      const next = slides.find((dish) => dish.id === pendingId);
      if (!next?.imageUrl) return;
      loading = true;
      // Precarga la siguiente foto antes de comenzar el fundido, sin dejar huecos.
      const optimized = getHeroDishImage(next.imageUrl);
      pendingImage = new Image();
      pendingImage.decoding = "async";
      pendingImage.fetchPriority = "low";
      pendingImage.onload = () => {
        if (cancelled) return;
        loading = false;
        setFrame({ activeId: next.id, previousId: current.id });
      };
      pendingImage.onerror = () => {
        loading = false;
      };
      if (optimized) {
        pendingImage.sizes = IMAGE_SIZES;
        pendingImage.srcset = `${optimized.small} 640w, ${optimized.large} 1120w`;
      }
      pendingImage.src = optimized?.large ?? next.imageUrl;
    }, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      if (loading && pendingId) remaining.current.unshift(pendingId);
      if (pendingImage) {
        pendingImage.onload = null;
        pendingImage.onerror = null;
      }
    };
  }, [slides, activeId, hovered, focused, visible, reducedMotion]);

  return (
    <Box
      component="figure"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Platos del día. La rotación se pausa al enfocar la fotografía."
      aria-live="off"
      tabIndex={slides.length > 1 ? 0 : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      sx={{
        m: 0,
        position: "relative",
        minWidth: 0,
        order: { xs: -1, sm: 0 },
        height: { xs: 180, sm: "100%" },
        minHeight: { sm: 360 },
        overflow: "hidden",
        bgcolor: "secondary.light",
        "&:focus-visible": {
          outline: "3px solid",
          outlineColor: "primary.dark",
          outlineOffset: -3,
        },
      }}
    >
      {slide ? (
        [previous, slide]
          .filter((dish): dish is Dish => Boolean(dish))
          .map((dish) => {
            const image = getHeroDishImage(dish.imageUrl ?? "");
            const active = dish.id === slide.id;
            return (
              <Box
                key={dish.id}
                component="img"
                src={image?.large ?? dish.imageUrl}
                srcSet={
                  image
                    ? `${image.small} 640w, ${image.large} 1120w`
                    : undefined
                }
                sizes={IMAGE_SIZES}
                width={1120}
                height={840}
                alt={
                  active ? (dish.isHipo ? "Menú hipocalórico" : dish.name) : ""
                }
                aria-hidden={!active || undefined}
                loading="eager"
                fetchPriority={activeId ? "auto" : "high"}
                decoding="async"
                className={active && previous ? styles.fadeIn : undefined}
                onAnimationEnd={
                  active
                    ? () =>
                        setFrame((current) => ({ activeId: current.activeId }))
                    : undefined
                }
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "block",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center 55%",
                }}
              />
            );
          })
      ) : isLoading ? (
        <Skeleton
          variant="rectangular"
          animation={reducedMotion ? false : "wave"}
          width="100%"
          height="100%"
          sx={{ position: "absolute", inset: 0 }}
          aria-label="Cargando fotografías del menú"
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            placeContent: "center",
            height: "100%",
            p: 3,
            textAlign: "center",
            gap: 1,
          }}
        >
          <RestaurantMenuIcon
            sx={{ mx: "auto", fontSize: 40, color: "primary.dark" }}
          />
          <Typography variant="body2" color="text.secondary">
            Las fotografías aparecerán cuando se publique el menú.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
