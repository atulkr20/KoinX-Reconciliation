// when the user say 'transfer_out' and exchange say 'transfer_in' they are the same transaction from oppo. perspective 
// so here in this file we will make theese two types considered equivalent

export const EQUIVALENT_TYPE_PAIRS: Array<[string, string]> = [
    ['TRANSFER_OUT', 'TRANSFER_IN'],
];

export const typeAreEquivalent = (typeA: string, typeB: string): boolean => {
    if(typeA === typeB) return true;

    for(const [a, b] of EQUIVALENT_TYPE_PAIRS) {
        if (
            ( typeA === a && typeB === b) || 
            (typeA === b && typeB === a)
        ) {
        return true;
        }
    }

    return false;
};