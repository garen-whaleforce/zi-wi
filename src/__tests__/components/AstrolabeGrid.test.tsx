/**
 * AstrolabeGrid 元件測試
 */

import { render, screen, fireEvent } from '@testing-library/react';
import AstrolabeGrid from '@/components/AstrolabeGrid';
import type { Palace } from '@/lib/types';

const mockPalaces: Palace[] = [
  {
    name: '命',
    branch: '子',
    stem: '甲',
    mainStars: [{ name: '紫微', type: 'main' }],
    minorStars: [{ name: '左輔', type: 'minor' }],
  },
  {
    name: '兄弟',
    branch: '丑',
    stem: '乙',
    mainStars: [{ name: '天機', type: 'main' }],
    minorStars: [],
  },
  {
    name: '夫妻',
    branch: '寅',
    stem: '丙',
    mainStars: [],
    minorStars: [{ name: '文昌', type: 'minor' }],
  },
];

describe('AstrolabeGrid', () => {
  it('應該渲染所有宮位', () => {
    render(<AstrolabeGrid palaces={mockPalaces} />);

    expect(screen.getByText('命')).toBeInTheDocument();
    expect(screen.getByText('兄弟')).toBeInTheDocument();
    expect(screen.getByText('夫妻')).toBeInTheDocument();
  });

  it('應該顯示宮位的天干地支', () => {
    render(<AstrolabeGrid palaces={mockPalaces} />);

    expect(screen.getByText('甲子')).toBeInTheDocument();
    expect(screen.getByText('乙丑')).toBeInTheDocument();
  });

  it('應該顯示主星', () => {
    render(<AstrolabeGrid palaces={mockPalaces} />);

    expect(screen.getByText('紫微')).toBeInTheDocument();
    expect(screen.getByText('天機')).toBeInTheDocument();
  });

  it('點擊宮位應該觸發 onPalaceSelect', () => {
    const handleSelect = jest.fn();
    render(
      <AstrolabeGrid palaces={mockPalaces} onPalaceSelect={handleSelect} />
    );

    const palace = screen.getByText('命').closest('button');
    if (palace) {
      fireEvent.click(palace);
    }

    expect(handleSelect).toHaveBeenCalledWith('命');
  });

  it('選中的宮位應該有特殊樣式', () => {
    render(<AstrolabeGrid palaces={mockPalaces} selectedPalace="命" />);

    const palaceButton = screen.getByText('命').closest('button');
    expect(palaceButton).toHaveClass('border-primary');
  });

  it('空命盤應該正常渲染', () => {
    render(<AstrolabeGrid palaces={[]} />);

    expect(screen.getByText('命盤（12 宮）')).toBeInTheDocument();
  });
});
