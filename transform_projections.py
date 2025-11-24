#!/usr/bin/env python3
import argparse
import pandas as pd
import numpy as np


def parse_salary(s):
    """
    Convert DK Salary string like '$10,000 ' into numeric float 10000.0.
    """
    if pd.isna(s):
        return np.nan
    s = str(s).strip()
    s = s.replace("$", "").replace(",", "")
    try:
        return float(s)
    except ValueError:
        return np.nan


def parse_percent_str(s):
    """
    Convert percent string like '2.90%' into float 2.90.
    If blank or NaN, return 0.0.
    """
    if pd.isna(s):
        return 0.0
    s = str(s).strip().replace("%", "")
    if s == "":
        return 0.0
    try:
        return float(s)
    except ValueError:
        return 0.0


def percentrank_inc(values, use_first=False):
    """
    Approximate Excel PERCENTRANK.INC.

    values: 1D array like floats
    use_first:
        False -> use last index for duplicates
        True  -> use first index for duplicates

    Returns array of fractions in [0, 1].
    """
    values = np.asarray(values, dtype=float)
    sorted_vals = np.sort(values)
    n = len(sorted_vals)
    if n <= 1:
        return np.zeros_like(values)

    ranks = []
    for x in values:
        idxs = np.where(sorted_vals == x)[0]
        if len(idxs) == 0:
            ranks.append(0.5)
            continue
        idx = idxs[0] if use_first else idxs[-1]
        ranks.append(idx / (n - 1))
    return np.array(ranks, dtype=float)


def transform(input_csv: str, output_csv: str):
    df = pd.read_csv(input_csv)

    # Column normalization if needed
    col_map = {
        "Player": "Player",
        "DK Pos": "DK Pos",
        "Team": "Team",
        "Opp": "Opp",
        "DK Salary": "DK Salary",
        "DK Proj": "DK Proj",
        "DK Value": "DK Value",
        "Small Field": "Small Field",
        "Large Field": "Large Field",
        "DK Floor": "DK Floor",
        "DK Ceiling": "DK Ceiling",
        "id": "id",
    }
    df = df.rename(columns=col_map)

    # Parse numeric salary
    df["salary_num"] = df["DK Salary"].apply(parse_salary)

    # Parse ownership from Large Field percentages
    large_field_pct = df["Large Field"].apply(parse_percent_str)

    # OWN_FRAC = Large Field percent as fraction, rounded to 2 decimals
    df["OWN_FRAC"] = (large_field_pct / 100.0).round(2)

    # LEVERAGE_SCORE = DK Ceiling * (1 - Large Field fraction)
    df["LEVERAGE_SCORE"] = df["DK Ceiling"] * (1.0 - (large_field_pct / 100.0))

    # VALUE_PER_1k = DK Proj / (salary / 1000)
    df["VALUE_PER_1k_raw"] = df["DK Proj"] / (df["salary_num"] / 1000.0)

    # Percentile ranks
    ceiling_vals = df["DK Ceiling"].values
    ceiling_rank = percentrank_inc(ceiling_vals, use_first=False)
    ownership_rank = percentrank_inc(large_field_pct.values, use_first=True)

    df["CEILING_PCT_RANK"] = (ceiling_rank * 100.0).round(2)
    df["OWNERSHIP_PCT_RANK"] = (ownership_rank * 100.0).round(0)

    # leverage_delta = ceiling_pct_rank - ownership_pct_rank
    df["leverage_delta_raw"] = df["CEILING_PCT_RANK"] - df["OWNERSHIP_PCT_RANK"]

    # Formatting to match sample output

    # DK Salary like '$5,600.00'
    df["DK Salary_out"] = df["salary_num"].apply(
        lambda x: f"${x:,.2f}" if pd.notna(x) else ""
    )

    # VALUE_PER_1k as '$X.XX'
    df["VALUE_PER_1k"] = df["VALUE_PER_1k_raw"].apply(
        lambda x: f"${x:.2f}" if pd.notna(x) else ""
    )

    # CEILING_PCT_RANK as 'XX.XX%'
    df["CEILING_PCT_RANK_out"] = df["CEILING_PCT_RANK"].apply(
        lambda x: f"{x:.2f}%"
    )

    # OWNERSHIP_PCT_RANK as '42%'
    df["OWNERSHIP_PCT_RANK_out"] = df["OWNERSHIP_PCT_RANK"].apply(
        lambda x: f"{int(x)}%"
    )

    # leverage_delta as 'XX.X%'
    df["leverage_delta_out"] = df["leverage_delta_raw"].apply(
        lambda x: f"{x:.1f}%"
    )

    # Final column order
    out_cols = [
        "Player",
        "DK Pos",
        "Team",
        "Opp",
        "DK Salary_out",        # renamed to DK Salary in output
        "DK Proj",
        "DK Value",
        "OWN_FRAC",
        "DK Floor",
        "DK Ceiling",
        "LEVERAGE_SCORE",
        "VALUE_PER_1k",
        "CEILING_PCT_RANK_out",
        "OWNERSHIP_PCT_RANK_out",
        "leverage_delta_out",
        "id",
    ]

    out_df = df[out_cols].copy()
    out_df = out_df.rename(
        columns={
            "DK Salary_out": "DK Salary",
            "CEILING_PCT_RANK_out": "CEILING_PCT_RANK",
            "OWNERSHIP_PCT_RANK_out": "OWNERSHIP_PCT_RANK",
            "leverage_delta_out": "leverage_delta",
        }
    )

    out_df.to_csv(output_csv, index=False)
    print(f"Saved transformed projections (large field) to {output_csv}")


def main():
    parser = argparse.ArgumentParser(
        description="Transform projections using LARGE FIELD ownership."
    )
    parser.add_argument("input_csv", help="Path to input projections CSV")
    parser.add_argument("output_csv", help="Path to write transformed CSV")
    args = parser.parse_args()

    transform(args.input_csv, args.output_csv)


if __name__ == "__main__":
    main()


