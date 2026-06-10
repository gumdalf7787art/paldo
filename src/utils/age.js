/**
 * 강아지 생일 문자열을 기반으로 오늘 날짜 기준 실시간 개월 수를 계산합니다.
 * @param {string} birthday - 'YYYY-MM-DD' 형태의 생일 날짜
 * @param {string} fallbackAge - 생일이 없을 경우 표시할 백업 나이 문자열
 * @returns {string} 실시간 개월수 / 일수 / 년수 표시 문자열
 */
export const calculateAge = (birthday, fallbackAge) => {
  if (!birthday) return fallbackAge || '나이 미상';

  try {
    const birthDate = new Date(birthday);
    if (isNaN(birthDate.getTime())) return fallbackAge || '나이 미상';

    const nowDate = new Date();

    // 두 날짜의 개월 수 차이 계산
    let months = (nowDate.getFullYear() - birthDate.getFullYear()) * 12 + (nowDate.getMonth() - birthDate.getMonth());
    
    // 현재 일이 태어난 일보다 앞서면 아직 한 달이 완전히 차지 않은 것이므로 1개월 차감
    if (nowDate.getDate() < birthDate.getDate()) {
      months--;
    }

    if (months < 0) return '0개월';

    // 0개월인 경우 일수 단위로 환산 표시
    if (months === 0) {
      const diffTime = Math.abs(nowDate - birthDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays}일`;
    }

    // 12개월 이상인 경우 년/개월 단위로 분리 표시
    if (months >= 12) {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      return remainingMonths > 0 ? `${years}년 ${remainingMonths}개월` : `${years}년`;
    }

    return `${months}개월`;
  } catch (e) {
    console.error('Age calculation error:', e);
    return fallbackAge || '나이 미상';
  }
};
