from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "Cong-thuc-12-dai-luong-Euclid.rtf"


SECTIONS = [
    (
        "1. meanEnergy",
        [
            ("code", "meanEnergy = (1 / M) * Σ(energy_i),  i = 1..M"),
            ("code", "energy_i = RMS_i^2 = (1 / N) * Σ(x_i[n]^2),  n = 1..N"),
            (
                "body",
                "Trong đó: M là số cửa sổ; N là số mẫu trong mỗi cửa sổ; "
                "x_i[n] là mẫu tín hiệu thứ n trong cửa sổ i.",
            ),
        ],
    ),
    (
        "2. maxEnergy",
        [
            ("code", "maxEnergy = max(energy_i),  i = 1..M"),
            ("body", "Là giá trị năng lượng lớn nhất trong toàn bộ các cửa sổ."),
        ],
    ),
    (
        "3. stdEnergy",
        [
            ("code", "stdEnergy = sqrt((1 / M) * Σ((energy_i - meanEnergy)^2)),  i = 1..M"),
            ("body", "Là độ lệch chuẩn của năng lượng giữa các cửa sổ."),
        ],
    ),
    (
        "4. meanLoudness",
        [
            ("code", "meanLoudness = (1 / M) * Σ(loudness_i),  i = 1..M"),
            ("code", "loudness_i = 20 * log10(RMS_i + ε)"),
            ("body", "Trong đó ε là một số rất nhỏ để tránh log(0)."),
        ],
    ),
    (
        "5. stdLoudness",
        [
            ("code", "stdLoudness = sqrt((1 / M) * Σ((loudness_i - meanLoudness)^2)),  i = 1..M"),
            ("body", "Là độ lệch chuẩn của loudness theo các cửa sổ."),
        ],
    ),
    (
        "6. dominantPitchHz",
        [
            ("code", "dominantPitchHz = (1 / K) * Σ(pitch_j),  với pitch_j > 0"),
            ("code", "pitch_j ≈ sampleRate / bestLag_j"),
            (
                "body",
                "Trong đó: K là số cửa sổ có pitch hợp lệ; bestLag_j là độ trễ có "
                "tự tương quan lớn nhất ở cửa sổ j.",
            ),
        ],
    ),
    (
        "7. normalizedBrightness",
        [
            ("code", "brightness_i = Σ(f_k * |X_i[k]|) / Σ(|X_i[k]|)"),
            ("code", "normalizedBrightness = clamp(((1 / M) * Σ(brightness_i)) / (sampleRate / 2), 0, 1)"),
            (
                "body",
                "Trong đó: f_k là tần số của bin phổ thứ k; |X_i[k]| là độ lớn phổ của cửa sổ i tại bin k. "
                "sampleRate / 2 là tần số Nyquist.",
            ),
        ],
    ),
    (
        "8. meanZeroCrossingRate",
        [
            ("code", "meanZeroCrossingRate = (1 / M) * Σ(zcr_i),  i = 1..M"),
            ("code", "zcr_i = crossings_i / (N - 1)"),
            ("body", "Trong đó crossings_i là số lần tín hiệu đổi dấu trong cửa sổ i."),
        ],
    ),
    (
        "9. maxPeak",
        [
            ("code", "peak_i = max(|x_i[n]|),  n = 1..N"),
            ("code", "maxPeak = max(peak_i),  i = 1..M"),
            ("body", "Là biên độ đỉnh lớn nhất trên toàn file."),
        ],
    ),
    (
        "10. burstRatio",
        [
            ("code", "burstRatio = maxEnergy / max(meanEnergy, 10^-6)"),
            (
                "body",
                "Đại lượng này phản ánh mức độ bùng phát của tín hiệu: nếu maxEnergy cao hơn "
                "nhiều so với meanEnergy thì burstRatio sẽ lớn.",
            ),
        ],
    ),
    (
        "11. activeWindowRatio",
        [
            ("code", "activeWindowRatio = count(energy_i > 1.25 * meanEnergy) / M"),
            ("body", "Là tỉ lệ cửa sổ được coi là hoạt động mạnh hơn mức trung bình."),
        ],
    ),
    (
        "12. durationSeconds",
        [
            ("code", "durationSeconds = totalSamples / sampleRate"),
            (
                "body",
                "Với file nén, hệ thống cũng có thể lấy duration từ metadata giải mã; "
                "giá trị cuối cùng được lưu trong summary.durationSeconds.",
            ),
        ],
    ),
]


def rtf_escape(text: str) -> str:
    escaped = []
    for ch in text:
        code = ord(ch)
        if ch == "\\":
            escaped.append(r"\\")
        elif ch == "{":
            escaped.append(r"\{")
        elif ch == "}":
            escaped.append(r"\}")
        elif ch == "\n":
            escaped.append(r"\line ")
        elif 32 <= code < 127:
            escaped.append(ch)
        else:
            if code > 32767:
                code -= 65536
            escaped.append(rf"\u{code}?")
    return "".join(escaped)


def para(text: str, font: int = 0, size: int = 24, bold: bool = False) -> str:
    bold_on = r"\b " if bold else ""
    bold_off = r"\b0 " if bold else ""
    return (
        r"\pard\sa160\sl276\slmult1"
        + rf"\f{font}\fs{size} "
        + bold_on
        + rtf_escape(text)
        + bold_off
        + r"\par"
        + "\n"
    )


def build_rtf() -> str:
    parts = [
        r"{\rtf1\ansi\deff0",
        r"{\fonttbl{\f0 Times New Roman;}{\f1 Consolas;}}",
        r"\viewkind4\uc1",
        "\n",
        para("Công thức tính 12 đại lượng dùng cho Euclid", size=30, bold=True),
        para(
            "Tài liệu này tổng hợp công thức của 12 đại lượng hiện đang được dùng để tạo "
            "comparison profile trong hệ thống tìm kiếm âm thanh theo khoảng cách Euclid.",
            size=24,
        ),
        para("", size=8),
    ]

    for title, blocks in SECTIONS:
        parts.append(para(title, size=26, bold=True))
        for kind, text in blocks:
            parts.append(para(text, font=1 if kind == "code" else 0, size=22))
        parts.append(para("", size=8))

    parts.append(para("Ghi chú về vector so sánh Euclid", size=26, bold=True))
    parts.append(
        para(
            "comparisonProfile = [\n"
            "  meanEnergy,\n"
            "  maxEnergy,\n"
            "  stdEnergy,\n"
            "  meanLoudness,\n"
            "  stdLoudness,\n"
            "  dominantPitchHz,\n"
            "  normalizedBrightness,\n"
            "  meanZeroCrossingRate,\n"
            "  maxPeak,\n"
            "  burstRatio,\n"
            "  activeWindowRatio,\n"
            "  durationSeconds\n"
            "]",
            font=1,
            size=22,
        )
    )
    parts.append(
        para(
            "Sau khi tạo vector này, hệ thống còn chuẩn hóa từng chiều, nhân trọng số, "
            "sau đó mới tính khoảng cách Euclid và quy đổi thành độ tương đồng.",
            size=24,
        )
    )
    parts.append(para("Nguồn theo code hiện tại", size=26, bold=True))
    parts.append(para("- apps/backend/src/services/signalFeatureService.js", size=22))
    parts.append(para("- apps/backend/src/services/libraryService.js", size=22))
    parts.append("}")
    return "".join(parts)


def main():
    OUTPUT.write_text(build_rtf(), encoding="ascii")
    print(str(OUTPUT))


if __name__ == "__main__":
    main()
