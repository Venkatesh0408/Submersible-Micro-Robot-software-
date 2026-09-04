import { Loader2 } from "lucide-react";
import "./Button.css";

/**
 * One button system for the whole app.
 * variant: primary | secondary | ghost | danger | success
 * size:    sm (32) | md (40) | lg (48)
 * icon:    true -> square icon-only button
 * loading: shows an inline spinner in place of the label (width preserved)
 */
export default function Button({
    children,
    variant = "primary",
    size = "md",
    icon = false,
    loading = false,
    disabled = false,
    as = "button",
    type = "button",
    className = "",
    iconLeft = null,
    iconRight = null,
    ...props
}) {
    const Comp = as;
    const classes = [
        "ui-btn",
        `ui-btn--${variant}`,
        `ui-btn--${size}`,
        icon ? "ui-btn--icon" : "",
        loading ? "is-loading" : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <Comp
            className={classes}
            disabled={disabled || loading}
            type={as === "button" ? type : undefined}
            aria-busy={loading || undefined}
            {...props}
        >
            {loading && <Loader2 className="ui-btn__spinner" size={size === "sm" ? 15 : size === "lg" ? 20 : 17} aria-hidden />}
            <span className="ui-btn__content">
                {iconLeft}
                {children != null && <span className="ui-btn__label">{children}</span>}
                {iconRight}
            </span>
        </Comp>
    );
}
