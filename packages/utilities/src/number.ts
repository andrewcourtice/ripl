export function numberGCD(valueA: number, valueB: number) {
    while (valueB !== 0) {
        const temp = valueB;

        valueB = valueA % valueB;
        valueA = temp;
    }

    return valueA;
}

export function numberNice(value: number, round: boolean = false) {
    const exponent = Math.floor(Math.log10(value));
    const factor = 10 ** exponent;
    const fraction = value / factor;

    let niceFraction: number;

    if (round) {
        if (fraction < 1.5) niceFraction = 1;
        else if (fraction < 3) niceFraction = 2;
        else if (fraction < 7) niceFraction = 5;
        else niceFraction = 10;
    } else {
        if (fraction <= 1) niceFraction = 1;
        else if (fraction <= 2) niceFraction = 2;
        else if (fraction <= 5) niceFraction = 5;
        else niceFraction = 10;
    }

    return niceFraction * factor;
}